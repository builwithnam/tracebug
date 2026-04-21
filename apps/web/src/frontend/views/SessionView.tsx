import { useState } from "react";
import type { SessionResponse, TraceResponse, ParsedStage } from "@tracebug/core";
import {
  useCollapsibleContext,
  Button,
  Badge,
  Spinner,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  JsonTree,
  TimingBar,
  PipelinePath,
  type PipelineStage,
  type TimingBarEntry,
} from "@tracebug/ui";

interface SessionViewProps {
  data: SessionResponse;
  onBack: () => void;
}

export function SessionView({ data, onBack }: SessionViewProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const tracesMap = new Map(data.traces.map((t) => [t.id, t]));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-6 sticky top-0 z-100 max-sm:flex-col max-sm:items-start max-sm:gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} title="New session" className="text-xl">
            ←
          </Button>
          <h1 className="text-lg font-medium tracking-tight text-foreground">tracebug</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto max-sm:ml-0 max-sm:flex-wrap">
          <Meta label="share_id" value={data.share_id} />
          <Meta label="session_id" value={data.session_id} />
        </div>
      </header>

      {/* Timeline */}
      <main className="max-w-[900px] mx-auto px-4 py-6 flex flex-col gap-3">
        {data.messages.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No messages found</p>
        ) : (
          data.messages.map((msg, i) => (
            <MessageCard
              key={msg.id}
              message={msg}
              trace={tracesMap.get(msg.id) ?? null}
              index={i}
              selected={selectedId === msg.id}
              onSelect={() => setSelectedId(selectedId === msg.id ? null : msg.id)}
            />
          ))
        )}
      </main>
    </div>
  );
}

/* ---------- Meta ---------- */

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wide">{label}</span>
      <span className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
        {value}
      </span>
    </>
  );
}

/* ---------- Message Card ---------- */

interface MessageCardProps {
  message: {
    id: number;
    type: string;
    text: string;
    created_at: string | null;
  };
  trace: TraceResponse | null;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

const TYPE_VARIANTS = {
  user: "user" as const,
  assistant: "assistant" as const,
  system: "default" as const,
};

const BORDER_COLORS = {
  user: "border-l-primary",
  assistant: "border-l-success",
  system: "border-l-muted-foreground/40",
};

const SELECTED_BG = {
  user: "bg-primary/5",
  assistant: "bg-success/5",
  system: "bg-muted/50",
};

function MessageCard({ message, trace, index, selected, onSelect }: MessageCardProps) {
  const type = message.type as keyof typeof TYPE_VARIANTS;
  const variant = TYPE_VARIANTS[type] ?? "default";
  const border = BORDER_COLORS[type] ?? "border-l-muted-foreground/40";
  const selectedBg = SELECTED_BG[type] ?? "bg-muted/50";

  return (
    <div
      onClick={onSelect}
      className={[
        "bg-card rounded-lg border border-border cursor-pointer transition-shadow duration-150 p-3.5 px-[18px] relative",
        "border-l-4",
        border,
        selected ? [selectedBg, "border-l-[5px]", "shadow-[0_2px_10px_rgba(0,0,0,0.08)]"] : "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <Badge variant={variant}>{message.type}</Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          {message.created_at ? formatTime(message.created_at) : `#${index + 1}`}
        </span>
      </div>

      {/* Body */}
      <MessageText text={message.text} />

      {/* Trace Panel */}
      {trace ? <TracePanel trace={trace} /> : <p className="text-xs text-muted-foreground italic py-2">No trace data available</p>}
    </div>
  );
}

/* ---------- Message Text ---------- */

function MessageText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <pre
        className={[
          "text-sm text-foreground whitespace-pre-wrap break-words",
          !expanded ? "max-h-[120px] overflow-hidden" : "",
        ].join(" ")}
      >
        {text}
      </pre>
      {text.length > 200 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-xs text-primary hover:underline mt-2 cursor-pointer"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

/* ---------- Trace Panel ---------- */

const STAGE_ORDER = [
  "querier",
  "router",
  "scenario_selector",
  "agent",
  "generator",
  "questioner",
] as const;

function TracePanel({ trace }: { trace: TraceResponse }) {
  const stages = trace.stages ?? {};
  const stat = trace.stat ?? {};

  const activeStages = STAGE_ORDER.filter((name) => stages[name] !== null);
  const timingEntries: TimingBarEntry[] = Object.entries(stat)
    .filter(([, v]) => v != null)
    .map(([key, value]) => ({
      label: key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2"),
      value: value as number,
    }));

  return (
    <div className="mt-3 border-t border-border pt-4">
      {/* Pipeline Path */}
      {activeStages.length > 0 && (
        <PipelinePath
          stages={STAGE_ORDER.map(
            (name): PipelineStage => ({
              name: name.replace(/_/g, " "),
              active: activeStages.includes(name),
            }),
          )}
          className="mb-4"
        />
      )}

      {/* Timing */}
      {timingEntries.length > 0 && <TimingBar entries={timingEntries} className="mb-4" />}

      {/* Stage Sections */}
      {activeStages.map((stageName) => {
        const stageData = stages[stageName];
        if (!stageData) return null;
        return <StageSection key={stageName} name={stageName} stage={stageData} />;
      })}
    </div>
  );
}

/* ---------- Stage Section ---------- */

function StageSection({ name, stage }: { name: string; stage: ParsedStage }) {
  return (
    <Collapsible defaultOpen className="border border-border rounded-md mb-2 overflow-hidden">
      {/* Header */}
      <CollapsibleTrigger className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-muted/50 hover:bg-muted transition-colors duration-150 cursor-pointer text-left">
        <ChevronIcon />
        <span className="text-sm font-medium text-foreground">{name.replace(/_/g, " ")}</span>
        {stage.error && (
          <span className="text-xs text-destructive italic ml-2">{stage.error}</span>
        )}
      </CollapsibleTrigger>

      {/* Body */}
      <CollapsibleContent className="border-t border-border p-3.5">
        {stage.error && <p className="text-xs text-destructive italic mb-2">{stage.error}</p>}
        {stage.summary && Object.keys(stage.summary).length > 0 && (
          <SummaryGrid summary={stage.summary} />
        )}
        <RawJsonToggle data={stage.raw} />
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ---------- Chevron ---------- */

function ChevronIcon({ className }: { className?: string }) {
  const { open } = useCollapsibleContext();
  return (
    <span
      className={[
        "text-[10px] text-muted-foreground w-3.5 text-center transition-transform duration-150 inline-block",
        open ? "rotate-90" : "",
        className,
      ].join(" ")}
    >
      ▶
    </span>
  );
}

/* ---------- Summary Grid ---------- */

function SummaryGrid({ summary }: { summary: Record<string, unknown> }) {
  return (
    <div className="grid gap-1.5">
      {Object.entries(summary).map(([key, value]) => (
        <div key={key} className="flex items-baseline gap-2 min-h-6">
          <div className="text-xs text-muted-foreground min-w-[120px] shrink-0 text-right max-sm:min-w-[80px]">
            {key.replace(/_/g, " ")}
          </div>
          <div
            className="text-[13px] text-foreground truncate max-w-[500px] hover:whitespace-normal hover:break-all max-sm:max-w-[300px]"
            title={typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}
          >
            {formatSummaryValue(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Raw JSON Toggle ---------- */

function RawJsonToggle({ data }: { data: unknown }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-xs text-primary hover:underline cursor-pointer mt-2"
      >
        {show ? "Hide raw JSON" : "Show raw JSON"}
      </button>
      {show && <JsonTree data={data} className="mt-2" />}
    </>
  );
}

/* ---------- Helpers ---------- */

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return "";
  }
}

function formatSummaryValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    if (Array.isArray(value)) return `[${value.length} items]`;
    const parts = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${typeof v === "number" ? v.toLocaleString() : v}`)
      .join(" · ");
    return parts.length > 120 ? parts.slice(0, 120) + "..." : parts;
  }
  const str = String(value);
  return str.length > 100 ? str.slice(0, 100) + "..." : str;
}
