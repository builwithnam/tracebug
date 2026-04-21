import { IncomingMessage, ServerResponse } from "http";
import type { AppConfig } from "@tracebug/core";
import {
  messageToResponse,
  groupTracesByMessageId,
  type SessionResponse,
} from "@tracebug/core";
import { createPool, getSessionByShareId, getPool } from "../db.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
} as const;

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, CORS_HEADERS);
  res.end(JSON.stringify(data));
}

export async function handleSession(
  _req: IncomingMessage,
  res: ServerResponse,
  config: AppConfig,
): Promise<void> {
  const url = new URL(_req.url ?? "/", "http://localhost");
  const shareId = url.searchParams.get("share_id");

  if (!shareId) {
    sendJson(res, 400, { error: "share_id is required" });
    return;
  }

  const pool = getPool() ?? createPool(config.db);

  try {
    const session = await getSessionByShareId(pool, shareId);

    if (!session) {
      sendJson(res, 404, { error: "Share ID not found" });
      return;
    }

    const response: SessionResponse = {
      share_id: session.share_id,
      session_id: session.session_id,
      messages: session.messages.map(messageToResponse),
      traces: groupTracesByMessageId(session.traces),
    };

    sendJson(res, 200, response);
  } catch (error) {
    console.error("handleSession error:", error);
    sendJson(res, 500, { error: "Internal server error" });
  }
}
