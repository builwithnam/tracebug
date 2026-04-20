import { IncomingMessage, ServerResponse } from "http";
import { AppConfig } from "../config.js";
import {
  createPool,
  getSessionId,
  getMessages,
  getMessageData,
  getPool,
  Message,
  MessageData,
} from "../db.js";
import { parseAllStages, ParsedStage } from "./stage-parser.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
} as const;

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, CORS_HEADERS);
  res.end(JSON.stringify(data));
}

interface MessageResponse {
  id: number;
  type: string;
  text: string;
  code: string | null;
  feedback_type: string | null;
  referer_id: number | null;
  quick_replies: string | null;
  buttons: string | null;
  metadata: string | null;
  created_at: string | null;
}

interface TraceResponse {
  id: number;
  created_at: string | null;
  stages: Record<string, ParsedStage | null>;
  stat: Record<string, number | null> | null;
}

interface SessionResponse {
  share_id: string;
  session_id: string;
  messages: MessageResponse[];
  traces: TraceResponse[];
}

function messageToResponse(msg: Message): MessageResponse {
  return {
    id: msg.id,
    type: msg.role,
    text: msg.content ?? "",
    code: null,
    feedback_type: null,
    referer_id: null,
    quick_replies: null,
    buttons: null,
    metadata: null,
    created_at: msg.created_at?.toISOString() ?? null,
  };
}

function groupTracesByMessageId(traces: MessageData[]): TraceResponse[] {
  if (traces.length === 0) return [];

  // All traces share the same session_id; group them all into one trace entry
  // since there's no message_id foreign key to link individual traces to messages.
  const parsed = parseAllStages(traces);
  return [
    {
      id: traces[0].id,
      created_at: traces[0].created_at?.toISOString() ?? null,
      stages: parsed.stages,
      stat: parsed.stat as unknown as Record<string, number | null> | null,
    },
  ];
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
    const sessionId = await getSessionId(pool, shareId);

    if (!sessionId) {
      sendJson(res, 404, { error: "Share ID not found" });
      return;
    }

    const [messages, messageData] = await Promise.all([
      getMessages(pool, sessionId),
      getMessageData(pool, sessionId),
    ]);

    const response: SessionResponse = {
      share_id: shareId,
      session_id: sessionId,
      messages: messages.map(messageToResponse),
      traces: groupTracesByMessageId(messageData),
    };

    sendJson(res, 200, response);
  } catch (error) {
    console.error("handleSession error:", error);
    sendJson(res, 500, { error: "Internal server error" });
  }
}
