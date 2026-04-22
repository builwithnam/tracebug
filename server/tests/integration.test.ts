import { describe, it, beforeAll, afterAll, expect } from "vitest";
import express, { type Express } from "express";
import mysql from "mysql2/promise";
import { sessionRouter } from "../src/routes/session.js";
import { createPool, closePool } from "../src/db.js";

const TEST_DB_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "voithan",
  database: "db_test",
};

function request(app: Express, path: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      const http = require("http");
      http
        .get(`http://localhost:${port}${path}`, (res: any) => {
          let body = "";
          res.on("data", (chunk: string) => (body += chunk));
          res.on("end", () => {
            server.close();
            resolve({
              status: res.statusCode ?? 0,
              body: JSON.parse(body),
            });
          });
        })
        .on("error", (err: Error) => {
          server.close();
          reject(err);
        });
    });
  });
}

describe("Integration: API end-to-end", () => {
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

    createPool(TEST_DB_CONFIG);
  });

  function createApp(): Express {
    const app = express();
    app.use("/api", sessionRouter());
    return app;
  }

  // ===== API error handling =====

  it("returns 400 when both share_id and session_id are missing", async () => {
    const { status, body } = await request(createApp(), "/api/session");
    expect(status).toBe(400);
    expect(body).toEqual({ error: "share_id or session_id is required" });
  });

  it("returns 404 for non-existent share_id", async () => {
    const { status, body } = await request(createApp(), "/api/session?share_id=does-not-exist");
    expect(status).toBe(404);
    expect(body).toEqual({ error: "Session not found" });
  });

  it("returns 404 for non-existent session_id", async () => {
    const { status, body } = await request(
      createApp(),
      "/api/session?session_id=does-not-exist",
    );
    expect(status).toBe(404);
    expect(body).toEqual({ error: "Session not found" });
  });

  // ===== Full API response =====

  it("returns valid session data for existing share_id", async () => {
    const { status, body: rawBody } = await request(
      createApp(),
      "/api/session?share_id=test-share-abc",
    );

    expect(status).toBe(200);

    const body = rawBody as Record<string, unknown>;
    expect(body.share_id).toBe("test-share-abc");
    expect(body.session_id).toBe("session-e2e");

    const messages = body.messages as Record<string, unknown>[];
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBe(4);
    expect(messages[0].type).toBe("user");
    expect(messages[0].text).toBe("I need help with booking");
    expect(messages[1].type).toBe("assistant");
    expect(messages[1].text).toContain("Sure!");

    const traces = body.traces as Record<string, unknown>[];
    expect(Array.isArray(traces)).toBe(true);
    expect(traces.length).toBe(1);

    const trace = traces[0];
    const stages = trace.stages as Record<string, unknown>;
    const stat = trace.stat as Record<string, unknown>;

    expect(stages.querier).toBeTruthy();
    expect((stages.querier as Record<string, unknown>).raw).toBeTruthy();
    expect((stages.querier as Record<string, unknown>).summary).toBeTruthy();

    expect(stages.router).toBeTruthy();
    expect((stages.router as Record<string, unknown>).summary).toBeTruthy();

    expect(stages.agent).toBeNull();
    expect(stages.generator).toBeNull();
    expect(stages.questioner).toBeNull();

    expect(stat).toBeTruthy();
    expect(stat.querierDuration).toBe(120);
    expect(stat.routerDuration).toBe(85);
    expect(stat.agentDuration).toBe(340);
  });

  // ===== Querier summary extraction =====

  it("extracts querier summary fields correctly", async () => {
    const { body: rawBody } = await request(createApp(), "/api/session?share_id=test-share-abc");
    const body = rawBody as Record<string, unknown>;
    const traces = body.traces as Record<string, unknown>[];
    const stages = traces[0].stages as Record<string, unknown>;
    const querier = stages.querier as Record<string, unknown>;
    const summary = querier.summary as Record<string, unknown>;

    expect(summary).toBeTruthy();
    expect(summary.language).toBe("en");
    expect(summary.intent).toBe("booking");
    expect(summary.model).toBe("gpt-4");
    const tokenUsage = summary.tokenUsage as Record<string, unknown>;
    expect(tokenUsage).toBeTruthy();
    expect(tokenUsage.promptTokens).toBe(150);
    expect(tokenUsage.totalTokens).toBe(180);
    expect(summary.traceId).toBe("trace-e2e-001");
  });

  // ===== Router summary extraction =====

  it("extracts router summary fields correctly", async () => {
    const { body: rawBody } = await request(createApp(), "/api/session?share_id=test-share-abc");
    const body = rawBody as Record<string, unknown>;
    const traces = body.traces as Record<string, unknown>[];
    const stages = traces[0].stages as Record<string, unknown>;
    const router = stages.router as Record<string, unknown>;
    const summary = router.summary as Record<string, unknown>;

    expect(summary).toBeTruthy();
    expect(summary.scenarioName).toBe("dental_booking");
    expect(summary.flowId).toBe("flow-001");
    expect(summary.intent).toBe("book_appointment");
    expect(summary.searchType).toBe("semantic");
  });

  afterAll(async () => {
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
