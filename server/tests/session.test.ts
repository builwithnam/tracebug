import { describe, it, beforeAll, afterAll, expect } from "vitest";
import express, { type Express } from "express";
import mysql from "mysql2/promise";
import { sessionRouter } from "../src/routes/session.js";
import { createPool, closePool, getSessionBySessionId } from "../src/db.js";

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

describe("GET /api/session", () => {
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
      "valid-share-id",
      "session-123",
    ]);

    // Insert a second session with no share record (for session_id-only lookup)
    await conn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-direct",
      "user",
      "Direct access",
    ]);

    await conn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-123",
      "user",
      "Hello",
    ]);

    await conn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-123",
      "assistant",
      "Hi there!",
    ]);

    await conn.execute("INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)", [
      "session-123",
      "querier",
      JSON.stringify({
        message: {
          kwargs: {
            content: "test query",
            additional_kwargs: {
              context: { traceId: "trace-123" },
              response_metadata: { model_name: "gpt-4" },
            },
          },
        },
      }),
    ]);

    await conn.execute("INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)", [
      "session-123",
      "stat",
      JSON.stringify({
        querierDuration: 100,
        routerDuration: 50,
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

  it("should return 400 when both share_id and session_id are missing", async () => {
    const { status, body } = await request(createApp(), "/api/session");

    expect(status).toBe(400);
    expect(body).toEqual({ error: "share_id or session_id is required" });
  });

  it("should return 404 when share_id not found", async () => {
    const { status, body } = await request(createApp(), "/api/session?share_id=non-existent");

    expect(status).toBe(404);
    expect(body).toEqual({ error: "Session not found" });
  });

  it("should return 404 when session_id not found", async () => {
    const { status, body } = await request(
      createApp(),
      "/api/session?session_id=non-existent",
    );

    expect(status).toBe(404);
    expect(body).toEqual({ error: "Session not found" });
  });

  it("should return session data with valid share_id", async () => {
    const { status, body: rawBody } = await request(
      createApp(),
      "/api/session?share_id=valid-share-id",
    );

    const body = rawBody as Record<string, unknown>;
    expect(status).toBe(200);
    expect(body.share_id).toBe("valid-share-id");
    expect(body.session_id).toBe("session-123");
    expect(Array.isArray(body.messages)).toBe(true);
    expect(Array.isArray(body.traces)).toBe(true);

    const messages = body.messages as Record<string, unknown>[];
    expect(messages.length).toBe(2);
    const msg = messages[0];
    expect("id" in msg).toBe(true);
    expect("type" in msg).toBe(true);
    expect("text" in msg).toBe(true);

    const traces = body.traces as Record<string, unknown>[];
    expect(traces.length).toBe(1);
    const trace = traces[0];
    expect("id" in trace).toBe(true);
    expect("stages" in trace).toBe(true);
    expect("stat" in trace).toBe(true);

    const stages = trace.stages as Record<string, unknown>;
    expect(stages.querier).toBeTruthy();

    const stat = trace.stat as Record<string, unknown>;
    expect(stat.querierDuration).toBe(100);
    expect(stat.routerDuration).toBe(50);
  });

  it("should return session data with valid session_id", async () => {
    const { status, body: rawBody } = await request(
      createApp(),
      "/api/session?session_id=session-123",
    );

    const body = rawBody as Record<string, unknown>;
    expect(status).toBe(200);
    expect(body.share_id).toBeNull();
    expect(body.session_id).toBe("session-123");
    expect(Array.isArray(body.messages)).toBe(true);
  });

  it("should return session data for session_id with no share record", async () => {
    const { status, body: rawBody } = await request(
      createApp(),
      "/api/session?session_id=session-direct",
    );

    const body = rawBody as Record<string, unknown>;
    expect(status).toBe(200);
    expect(body.share_id).toBeNull();
    expect(body.session_id).toBe("session-direct");
    const messages = body.messages as Record<string, unknown>[];
    expect(messages.length).toBe(1);
  });

  it("should return 500 for unexpected errors", async () => {
    await closePool();

    createPool({
      host: "invalid-host",
      port: 9999,
      user: "invalid",
      password: "invalid",
      database: "invalid",
    });

    const { status, body } = await request(createApp(), "/api/session?share_id=test");

    expect(status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
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
