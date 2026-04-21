import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import { DbConfig } from "./config.js";

let pool: Pool | null = null;

export interface Message {
  id: number;
  session_id: string;
  type: string;
  text: string | null;
  code: string | null;
  feedback_type: string | null;
  referer_id: number | null;
  quick_replies: string | null;
  buttons: string | null;
  metadata: string | null;
  created_at: Date;
}

export interface MessageData {
  id: number;
  session_id: string;
  user_journey: string | null;
  querier: string | null;
  router: string | null;
  scenario_selector: string | null;
  agent: string | null;
  generator: string | null;
  questioner: string | null;
  stat: string | null;
  created_at: Date;
}

export interface SessionData {
  share_id: string;
  session_id: string;
  messages: Message[];
  traces: MessageData[];
}

export function createPool(dbConfig: DbConfig): Pool {
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

export async function getSessionId(pool: Pool, shareId: string): Promise<string | null> {
  const conn = await pool.getConnection();

  try {
    const [shares] = await conn.query<RowDataPacket[]>(
      "SELECT session_id FROM share WHERE id = ?",
      [shareId],
    );

    if (shares.length === 0) {
      return null;
    }

    return shares[0].session_id as string;
  } finally {
    conn.release();
  }
}

export async function getMessages(pool: Pool, sessionId: string): Promise<Message[]> {
  const conn = await pool.getConnection();

  try {
    const [messages] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM message WHERE session_id = ? ORDER BY id",
      [sessionId],
    );

    return messages as Message[];
  } finally {
    conn.release();
  }
}

export async function getMessageData(pool: Pool, sessionId: string): Promise<MessageData[]> {
  const conn = await pool.getConnection();

  try {
    const [traces] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM message_data WHERE session_id = ? ORDER BY id",
      [sessionId],
    );

    return traces as MessageData[];
  } finally {
    conn.release();
  }
}

export async function getSessionByShareId(
  pool: Pool,
  shareId: string,
): Promise<SessionData | null> {
  const sessionId = await getSessionId(pool, shareId);

  if (!sessionId) {
    return null;
  }

  const [messages, traces] = await Promise.all([
    getMessages(pool, sessionId),
    getMessageData(pool, sessionId),
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

export function getPool(): Pool | null {
  return pool;
}
