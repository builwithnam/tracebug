import { Message, MessageData } from "./types.js";
import { parseAllStages, ParsedStage } from "./stage-parser.js";

export interface MessageResponse {
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

export interface TraceResponse {
  id: number;
  created_at: string | null;
  stages: Record<string, ParsedStage | null>;
  stat: Record<string, number | null> | null;
}

export interface SessionResponse {
  share_id: string;
  session_id: string;
  messages: MessageResponse[];
  traces: TraceResponse[];
}

export function messageToResponse(msg: Message): MessageResponse {
  return {
    id: msg.id,
    type: msg.type,
    text: msg.text ?? "",
    code: msg.code,
    feedback_type: msg.feedback_type,
    referer_id: msg.referer_id,
    quick_replies: msg.quick_replies,
    buttons: msg.buttons,
    metadata: msg.metadata,
    created_at: msg.created_at?.toISOString() ?? null,
  };
}

export function groupTracesByMessageId(traces: MessageData[]): TraceResponse[] {
  if (traces.length === 0) return [];

  // Each message_data record has an 'id' which is the message_id it belongs to.
  // Return one trace entry per message_data record.
  return traces.map((trace) => {
    const parsed = parseAllStages([trace]);
    return {
      id: trace.id,
      created_at: trace.created_at?.toISOString() ?? null,
      stages: parsed.stages,
      stat: parsed.stat as unknown as Record<string, number | null> | null,
    };
  });
}
