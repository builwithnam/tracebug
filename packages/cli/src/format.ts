import type { SessionData } from "@tracebug/core";

export function formatOutput(session: SessionData, format: "json" | "pretty"): string {
  if (format === "json") {
    return JSON.stringify(session, null, 2);
  }

  return formatPretty(session);
}

function formatPretty(session: SessionData): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  if (session.share_id) {
    lines.push(`Share ID: ${session.share_id}`);
  }
  lines.push(`Session ID: ${session.session_id}`);
  lines.push("=".repeat(60));
  lines.push("");

  lines.push(`Messages (${session.messages.length}):`);
  lines.push("-".repeat(60));

  for (const msg of session.messages) {
    const role = msg.type === "user" ? "USER" : "ASSISTANT";
    lines.push(`[${role}] ID: ${msg.id}`);
    if (msg.text) {
      lines.push(`Text: ${msg.text.substring(0, 200)}${msg.text.length > 200 ? "..." : ""}`);
    }
    if (msg.code) {
      lines.push(`Code: ${msg.code.substring(0, 100)}${msg.code.length > 100 ? "..." : ""}`);
    }
    if (msg.feedback_type) {
      lines.push(`Feedback: ${msg.feedback_type}`);
    }
    lines.push("");
  }

  lines.push(`Traces (${session.traces.length}):`);
  lines.push("-".repeat(60));

  for (const trace of session.traces) {
    lines.push(`Message ID: ${trace.id}`);

    const stages = [
      { name: "querier", data: trace.querier },
      { name: "router", data: trace.router },
      { name: "scenario_selector", data: trace.scenario_selector },
      { name: "agent", data: trace.agent },
      { name: "generator", data: trace.generator },
      { name: "questioner", data: trace.questioner },
    ];

    for (const stage of stages) {
      if (stage.data) {
        lines.push(`  ${stage.name}:`);
        try {
          const parsed = JSON.parse(stage.data);
          lines.push(`    ${JSON.stringify(parsed, null, 2).split("\n").join("\n    ")}`);
        } catch {
          lines.push(`    ${stage.data.substring(0, 150)}...`);
        }
      }
    }

    if (trace.stat) {
      lines.push(`  stat: ${trace.stat}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function formatError(message: string): string {
  return `ERROR: ${message}`;
}
