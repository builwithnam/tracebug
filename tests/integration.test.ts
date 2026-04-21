import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import http from "http";
import mysql from "mysql2/promise";
import { createServer } from "../dist/server.js";
import { closePool } from "../dist/db.js";

const TEST_DB_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "voithan",
  database: "db_test",
};

const CONFIG = { port: 0, db: TEST_DB_CONFIG }; // port 0 = random available port

let server: http.Server;
let _baseUrl: string;

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
  before(async () => {
    // Set up test database
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

    // Insert a complete test session
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

    // Insert querier trace
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

    // Insert router trace
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

    // Insert stat trace
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

    // Start server on random port
    server = createServer(CONFIG);
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });

    const addr = server.address() as { port: number };
    _baseUrl = `http://localhost:${addr.port}`;
  });

  after(async () => {
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

  // ===== Static file serving =====

  it("serves index.html at /", async () => {
    const res = await get((server.address() as { port: number }).port, "/");
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes("tracebug"));
    assert.ok(res.body.includes("share-id-input"));
    assert.ok(res.body.includes('href="/style.css"'));
    assert.ok(res.body.includes('src="/app.js"'));
  });

  it("serves style.css", async () => {
    const res = await get((server.address() as { port: number }).port, "/style.css");
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers["content-type"]?.includes("text/css"));
    assert.ok(res.body.includes(".message-card"));
    assert.ok(res.body.includes(".json-tree"));
  });

  it("serves app.js", async () => {
    const res = await get((server.address() as { port: number }).port, "/app.js");
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers["content-type"]?.includes("javascript"));
    assert.ok(res.body.includes("fetchSession"));
    assert.ok(res.body.includes("renderJsonTree"));
  });

  it("returns 404 for unknown routes", async () => {
    const res = await get((server.address() as { port: number }).port, "/unknown");
    assert.strictEqual(res.status, 404);
  });

  // ===== API error handling =====

  it("returns 400 when share_id is missing", async () => {
    const res = await get((server.address() as { port: number }).port, "/api/session");
    assert.strictEqual(res.status, 400);
    const body = JSON.parse(res.body);
    assert.deepStrictEqual(body, { error: "share_id is required" });
  });

  it("returns 404 for non-existent share_id", async () => {
    const res = await get(
      (server.address() as { port: number }).port,
      "/api/session?share_id=does-not-exist",
    );
    assert.strictEqual(res.status, 404);
    const body = JSON.parse(res.body);
    assert.deepStrictEqual(body, { error: "Share ID not found" });
  });

  // ===== Full API response =====

  it("returns valid session data for existing share_id", async () => {
    const res = await get(
      (server.address() as { port: number }).port,
      "/api/session?share_id=test-share-abc",
    );

    assert.strictEqual(res.status, 200);

    const body = JSON.parse(res.body);
    assert.strictEqual(body.share_id, "test-share-abc");
    assert.strictEqual(body.session_id, "session-e2e");

    // Messages
    assert.ok(Array.isArray(body.messages));
    assert.strictEqual(body.messages.length, 4);
    assert.strictEqual(body.messages[0].type, "user");
    assert.strictEqual(body.messages[0].text, "I need help with booking");
    assert.strictEqual(body.messages[1].type, "assistant");
    assert.ok(body.messages[1].text.includes("Sure!"));
    assert.ok(body.messages[0].created_at);

    // Traces: all pipeline stages grouped into one trace entry
    assert.ok(Array.isArray(body.traces));
    assert.strictEqual(body.traces.length, 1);

    const trace = body.traces[0];
    assert.ok("id" in trace);
    assert.ok("stages" in trace);
    assert.ok("stat" in trace);

    // Querier stage should be parsed
    assert.ok(trace.stages.querier);
    assert.ok(trace.stages.querier.raw);
    assert.ok(trace.stages.querier.summary);

    // Router stage should be parsed
    assert.ok(trace.stages.router);
    assert.ok(trace.stages.router.summary);

    // Stages that didn't fire should be null
    assert.strictEqual(trace.stages.agent, null);
    assert.strictEqual(trace.stages.generator, null);
    assert.strictEqual(trace.stages.questioner, null);

    // Stat should have timing data
    assert.ok(trace.stat);
    assert.strictEqual(trace.stat.querierDuration, 120);
    assert.strictEqual(trace.stat.routerDuration, 85);
    assert.strictEqual(trace.stat.agentDuration, 340);
  });

  it("includes CORS headers on all API responses", async () => {
    const res = await get(
      (server.address() as { port: number }).port,
      "/api/session?share_id=test-share-abc",
    );
    assert.strictEqual(res.headers["access-control-allow-origin"], "*");
    assert.ok(res.headers["content-type"]?.includes("application/json"));
  });

  // ===== Querier summary extraction =====

  it("extracts querier summary fields correctly", async () => {
    const res = await get(
      (server.address() as { port: number }).port,
      "/api/session?share_id=test-share-abc",
    );
    const body = JSON.parse(res.body);
    const querier = body.traces[0].stages.querier;

    assert.ok(querier.summary);
    assert.strictEqual(querier.summary.language, "en");
    assert.strictEqual(querier.summary.intent, "booking");
    assert.strictEqual(querier.summary.model, "gpt-4");
    assert.ok(querier.summary.tokenUsage);
    assert.strictEqual(querier.summary.tokenUsage.promptTokens, 150);
    assert.strictEqual(querier.summary.tokenUsage.totalTokens, 180);
    assert.strictEqual(querier.summary.traceId, "trace-e2e-001");
  });

  // ===== Router summary extraction =====

  it("extracts router summary fields correctly", async () => {
    const res = await get(
      (server.address() as { port: number }).port,
      "/api/session?share_id=test-share-abc",
    );
    const body = JSON.parse(res.body);
    const router = body.traces[0].stages.router;

    assert.ok(router.summary);
    assert.strictEqual(router.summary.scenarioName, "dental_booking");
    assert.strictEqual(router.summary.flowId, "flow-001");
    assert.strictEqual(router.summary.intent, "book_appointment");
    assert.strictEqual(router.summary.searchType, "semantic");
  });
});
