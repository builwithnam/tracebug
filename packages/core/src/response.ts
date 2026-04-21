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
