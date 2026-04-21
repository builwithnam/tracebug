import { describe, it, beforeAll, afterAll, expect } from "vitest";
import http from "http";
import mysql from "mysql2/promise";
import { createServer } from "../src/server/server.js";
import { closePool } from "../src/server/db.js";

const TEST_DB_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "voithan",
  database: "db_test",
};

const CONFIG = { port: 0, db: TEST_DB_CONFIG };

let server: http.Server;

function get(
  port: number,
  path: string,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:${port}${path}`, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body });
        });
      })
      .on("error", reject);
  });
}

describe("Integration: full flow end-to-end", () => {
  beforeAll(async () => {
    const conn = await mysql.createConnection({
      host: TEST_DB_CONFIG.host,
      port: TEST_DB_CONFIG.port,
      user: TEST_DB_CONFIG.user,
      password: TEST_DB_CONFIG.password,
    });

    await conn.query(`DROP DATABASE IF EXISTS ${TEST_DB_CONFIG.database}`);
    await conn.query(`CREATE DATABASE ${TEST_DB_CONFIG.database}`);
    await conn.query(`USE ${TEST_DB_CONFIG.database}`);

    await conn.query(`
      CREATE TABLE share (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE message (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE message_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        stage VARCHAR(100) NOT NULL,
        payload JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.execute("INSERT INTO share (id, session_id) VALUES (?, ?)", [
      "test-share-abc",
      "session-e2e",
    ]);

    await conn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-e2e",
      "user",
      "I need help with booking",
    ]);

    await conn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-e2e",
      "assistant",
      "Sure! I can help you with that. What service are you looking for?",
    ]);

    await conn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-e2e",
      "user",
      "Dental cleaning",
    ]);

    await conn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-e2e",
      "assistant",
      "Let me find dental cleaning options for you.",
    ]);

    await conn.execute("INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)", [
      "session-e2e",
      "querier",
      JSON.stringify({
        message: {
          kwargs: {
            content: "",
            additional_kwargs: {
              tool_calls: [
                {
                  function: {
                    name: "detect_intent",
                    arguments: JSON.stringify({ language: "en", intent: "booking" }),
                  },
                },
              ],
              context: { traceId: "trace-e2e-001" },
            },
            response_metadata: {
              model_name: "gpt-4",
              token_usage: { prompt_tokens: 150, completion_tokens: 30, total_tokens: 180 },
            },
          },
        },
      }),
    ]);

    await conn.execute("INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)", [
      "session-e2e",
      "router",
      JSON.stringify({
        message: {
          kwargs: {
            content: "",
            additional_kwargs: {
              tool_calls: [
                {
                  function: {
                    name: "route_query",
                    arguments: JSON.stringify({
                      scenario: "dental_booking",
                      flow_id: "flow-001",
                      intent: "book_appointment",
                      search_type: "semantic",
                    }),
                  },
                },
              ],
            },
          },
        },
      }),
    ]);

    await conn.execute("INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)", [
      "session-e2e",
      "stat",
      JSON.stringify({
        querierDuration: 120,
        routerDuration: 85,
        agentDuration: 340,
        generatorDuration: 200,
      }),
    ]);

    await conn.end();

    server = createServer(CONFIG);
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
  });

  function port(): number {
    return (server.address() as { port: number }).port;
  }

  // ===== Static file serving =====

  it("serves index.html at /", async () => {
    const res = await get(port(), "/");
    expect(res.status).toBe(200);
    expect(res.body).toContain("tracebug");
    expect(res.body).toContain("share-id-input");
    expect(res.body).toContain('href="/style.css"');
    expect(res.body).toContain('src="/app.js"');
  });

  it("serves style.css", async () => {
    const res = await get(port(), "/style.css");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/css");
    expect(res.body).toContain(".message-card");
    expect(res.body).toContain(".json-tree");
  });

  it("serves app.js", async () => {
    const res = await get(port(), "/app.js");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("javascript");
    expect(res.body).toContain("fetchSession");
    expect(res.body).toContain("renderJsonTree");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await get(port(), "/unknown");
    expect(res.status).toBe(404);
  });

  // ===== API error handling =====

  it("returns 400 when share_id is missing", async () => {
    const res = await get(port(), "/api/session");
    expect(res.status).toBe(400);
    const body = JSON.parse(res.body);
    expect(body).toEqual({ error: "share_id is required" });
  });

  it("returns 404 for non-existent share_id", async () => {
    const res = await get(port(), "/api/session?share_id=does-not-exist");
    expect(res.status).toBe(404);
    const body = JSON.parse(res.body);
    expect(body).toEqual({ error: "Share ID not found" });
  });

  // ===== Full API response =====

  it("returns valid session data for existing share_id", async () => {
    const res = await get(port(), "/api/session?share_id=test-share-abc");

    expect(res.status).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.share_id).toBe("test-share-abc");
    expect(body.session_id).toBe("session-e2e");

    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages.length).toBe(4);
    expect(body.messages[0].type).toBe("user");
    expect(body.messages[0].text).toBe("I need help with booking");
    expect(body.messages[1].type).toBe("assistant");
    expect(body.messages[1].text).toContain("Sure!");
    expect(body.messages[0].created_at).toBeTruthy();

    expect(Array.isArray(body.traces)).toBe(true);
    expect(body.traces.length).toBe(1);

    const trace = body.traces[0];
    expect("id" in trace).toBe(true);
    expect("stages" in trace).toBe(true);
    expect("stat" in trace).toBe(true);

    expect(trace.stages.querier).toBeTruthy();
    expect(trace.stages.querier.raw).toBeTruthy();
    expect(trace.stages.querier.summary).toBeTruthy();

    expect(trace.stages.router).toBeTruthy();
    expect(trace.stages.router.summary).toBeTruthy();

    expect(trace.stages.agent).toBeNull();
    expect(trace.stages.generator).toBeNull();
    expect(trace.stages.questioner).toBeNull();

    expect(trace.stat).toBeTruthy();
    expect(trace.stat.querierDuration).toBe(120);
    expect(trace.stat.routerDuration).toBe(85);
    expect(trace.stat.agentDuration).toBe(340);
  });

  it("includes CORS headers on all API responses", async () => {
    const res = await get(port(), "/api/session?share_id=test-share-abc");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
    expect(res.headers["content-type"]).toContain("application/json");
  });

  // ===== Querier summary extraction =====

  it("extracts querier summary fields correctly", async () => {
    const res = await get(port(), "/api/session?share_id=test-share-abc");
    const body = JSON.parse(res.body);
    const querier = body.traces[0].stages.querier;

    expect(querier.summary).toBeTruthy();
    expect(querier.summary.language).toBe("en");
    expect(querier.summary.intent).toBe("booking");
    expect(querier.summary.model).toBe("gpt-4");
    expect(querier.summary.tokenUsage).toBeTruthy();
    expect(querier.summary.tokenUsage.promptTokens).toBe(150);
    expect(querier.summary.tokenUsage.totalTokens).toBe(180);
    expect(querier.summary.traceId).toBe("trace-e2e-001");
  });

  // ===== Router summary extraction =====

  it("extracts router summary fields correctly", async () => {
    const res = await get(port(), "/api/session?share_id=test-share-abc");
    const body = JSON.parse(res.body);
    const router = body.traces[0].stages.router;

    expect(router.summary).toBeTruthy();
    expect(router.summary.scenarioName).toBe("dental_booking");
    expect(router.summary.flowId).toBe("flow-001");
    expect(router.summary.intent).toBe("book_appointment");
    expect(router.summary.searchType).toBe("semantic");
  });

  afterAll(async () => {
    server.close();
    await closePool();

    const conn = await mysql.createConnection({
      host: TEST_DB_CONFIG.host,
      port: TEST_DB_CONFIG.port,
      user: TEST_DB_CONFIG.user,
      password: TEST_DB_CONFIG.password,
    });
    await conn.query(`DROP DATABASE IF EXISTS ${TEST_DB_CONFIG.database}`);
    await conn.end();
  });
});
