import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import type { DbConfig, Message, MessageData, SessionData } from "@tracebug/core";
import { getConfig } from "./config.js";

let pool: Pool | null = null;

async function withConnection<T>(
  pool: Pool,
  fn: (conn: import("mysql2/promise").PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

function createPool(dbConfig: DbConfig): Pool {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  return pool;
}

async function getSessionId(pool: Pool, shareId: string): Promise<string | null> {
  return withConnection(pool, async (conn) => {
    const [shares] = await conn.query<RowDataPacket[]>(
      "SELECT session_id FROM share WHERE id = ?",
      [shareId],
    );
    return shares.length === 0 ? null : (shares[0].session_id as string);
  });
}

async function getMessages(pool: Pool, sessionId: string): Promise<Message[]> {
  return withConnection(pool, async (conn) => {
    const [messages] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM message WHERE session_id = ? ORDER BY id",
      [sessionId],
    );
    return messages as Message[];
  });
}

async function getMessageData(pool: Pool, sessionId: string): Promise<MessageData[]> {
  return withConnection(pool, async (conn) => {
    const [traces] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM message_data WHERE session_id = ? ORDER BY id",
      [sessionId],
    );
    return traces as MessageData[];
  });
}

export async function getSessionByShareId(shareId: string): Promise<SessionData | null> {
  const config = getConfig();
  const dbPool = createPool(config.db);
  const sessionId = await getSessionId(dbPool, shareId);

  if (!sessionId) {
    return null;
  }

  const [messages, traces] = await Promise.all([
    getMessages(dbPool, sessionId),
    getMessageData(dbPool, sessionId),
  ]);

  return {
    share_id: shareId,
    session_id: sessionId,
    messages,
    traces,
  };
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
