"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
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

function SessionPageInner() {
  const searchParams = useSearchParams();
  const shareId = searchParams.get("share_id");
  const sessionId = searchParams.get("session_id");

  const [data, setData] = useState<SessionResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareId && !sessionId) {
      setError("No share ID or session ID provided");
      setLoading(false);
      return;
    }

    async function fetchSession() {
      try {
        const params = shareId
          ? `share_id=${encodeURIComponent(shareId!)}`
          : `session_id=${encodeURIComponent(sessionId!)}`;
        const res = await fetch(`/api/session?${params}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Session not found" : `Server error: ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [shareId, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4 text-destructive">○</div>
          <p className="text-base text-destructive font-serif">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <SessionView data={data} />;
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      }
    >
      <SessionPageInner />
    </Suspense>
  );
}

/* ---------- Session View ---------- */

function SessionView({ data }: { data: SessionResponse }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const tracesMap = new Map(data.traces.map((t) => [t.id, t]));

  return (
    <div className="min-h-screen">
      {/* Header - warm, editorial */}
      <header className="bg-card border-b border-border px-6 py-5 flex items-center gap-6 sticky top-0 z-50 max-sm:flex-col max-sm:items-start max-sm:gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-2xl text-foreground hover:text-primary hover:underline transition-colors duration-200"
          >
            ←
          </a>
          <div>
            <h1 className="text-xl font-serif font-normal text-foreground">tracebug</h1>
            <p className="text-xs text-foreground-tertiary">Session Inspector</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-foreground-secondary ml-auto max-sm:ml-0 max-sm:flex-wrap max-sm:gap-3">
          {data.share_id && <Meta label="share_id" value={data.share_id} />}
          <Meta label="session_id" value={data.session_id} />
        </div>
      </header>

      {/* Timeline - editorial spacing */}
      <main className="max-w-[900px] mx-auto px-4 py-10 flex flex-col gap-4 page-transition">
        {data.messages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-foreground-tertiary italic font-serif">
              No messages found
            </p>
          </div>
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
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-foreground-tertiary">
        {label}
      </span>
      <span className="font-mono text-xs text-foreground-secondary bg-muted px-2.5 py-1 rounded-md">
        {value}
      </span>
    </div>
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
  system: "system" as const,
};

const BORDER_COLORS = {
  user: "border-l-user border-l-3",
  assistant: "border-l-assistant border-l-3",
  system: "border-l-system border-l-3",
};

const SELECTED_BG = {
  user: "bg-user/5",
  assistant: "bg-assistant/5",
  system: "bg-system/5",
};

function MessageCard({ message, trace, index, selected, onSelect }: MessageCardProps) {
  const type = message.type as keyof typeof TYPE_VARIANTS;
  const variant = TYPE_VARIANTS[type] ?? "system";
  const border = BORDER_COLORS[type] ?? "border-l-muted-foreground border-l-3";
  const selectedBg = SELECTED_BG[type] ?? "bg-muted/30";

  return (
    <div
      onClick={onSelect}
      className={[
        "bg-card rounded-lg border border-border cursor-pointer transition-all duration-200 overflow-hidden",
        border,
        selected
          ? [selectedBg, "shadow-[rgba(0,0,0,0.06)_0px_8px_32px] border-border-strong"]
          : "shadow-[rgba(0,0,0,0.02)_0px_2px_12px] hover:shadow-[rgba(0,0,0,0.04)_0px_4px_20px]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <Badge variant={variant}>{message.type}</Badge>
          <span className="text-xs text-foreground-tertiary ml-auto">
            {message.created_at ? formatTime(message.created_at) : `#${index + 1}`}
          </span>
        </div>

        {/* Body */}
        <MessageText text={message.text} />
      </div>

      {/* Trace Panel */}
      <div className="border-t border-border">
        {trace ? (
          <TracePanel trace={trace} />
        ) : (
          <div className="p-4 text-center">
            <p className="text-xs text-foreground-tertiary italic font-serif">
              No trace data available
            </p>
          </div>
        )}
      </div>
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
          "text-sm text-foreground whitespace-pre-wrap break-words font-mono leading-relaxed",
          !expanded ? "max-h-[160px] overflow-hidden relative" : "",
        ].join(" ")}
      >
        {text}
        {!expanded && text.length > 400 && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
        )}
      </pre>
      {text.length > 400 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-xs text-primary hover:text-primary-hover underline-offset-4 hover:underline mt-3 transition-colors duration-200"
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
    <div className="p-5 pt-4">
      {/* Pipeline Path */}
      {activeStages.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-foreground-tertiary mb-2">
            Pipeline
          </div>
          <PipelinePath
            stages={STAGE_ORDER.map(
              (name): PipelineStage => ({
                name: name.replace(/_/g, " "),
                active: activeStages.includes(name),
              }),
            )}
          />
        </div>
      )}

      {/* Timing */}
      {timingEntries.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-foreground-tertiary mb-2">
            Timing
          </div>
          <TimingBar entries={timingEntries} />
        </div>
      )}

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
    <Collapsible defaultOpen className="border border-border rounded-lg mb-3 overflow-hidden hover:border-border-strong transition-colors duration-200">
      {/* Header */}
      <CollapsibleTrigger className="w-full flex items-center gap-3 px-5 py-3 bg-muted/40 hover:bg-muted/60 transition-colors duration-200 cursor-pointer group">
        <ChevronIcon />
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground flex-1">
          {name.replace(/_/g, " ")}
        </span>
        {stage.error && (
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-destructive">
            Error
          </span>
        )}
      </CollapsibleTrigger>

      {/* Body */}
      <CollapsibleContent className="border-t border-border">
        <div className="p-5">
          {stage.error && (
            <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-xs text-destructive font-serif">{stage.error}</p>
            </div>
          )}
          {stage.summary && Object.keys(stage.summary).length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-foreground-tertiary mb-2">
                Summary
              </div>
              <SummaryGrid summary={stage.summary} />
            </div>
          )}
          <RawJsonToggle data={stage.raw} />
        </div>
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
        "text-[10px] text-foreground-secondary w-4 text-center transition-transform duration-200 inline-block",
        open ? "rotate-90 text-primary" : "",
        "group-hover:text-foreground",
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
    <div className="grid gap-2">
      {Object.entries(summary).map(([key, value]) => (
        <div
          key={key}
          className="flex items-baseline gap-3 min-h-6 hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors"
        >
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-foreground-tertiary min-w-[110px] shrink-0 text-right max-sm:min-w-[80px]">
            {key.replace(/_/g, " ")}
          </div>
          <div
            className="text-xs text-foreground truncate max-w-[500px] hover:whitespace-normal hover:break-all max-sm:max-w-[300px] font-mono"
            title={
              typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : String(value)
            }
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
        className="text-[10px] font-medium uppercase tracking-[0.1em] text-primary hover:text-primary-hover underline-offset-4 hover:underline transition-colors duration-200"
      >
        {show ? "Hide raw JSON" : "Show raw JSON"}
      </button>
      {show && <JsonTree data={data} className="mt-3" />}
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
