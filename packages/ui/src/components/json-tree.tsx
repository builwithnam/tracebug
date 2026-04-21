import * as React from "react";
import { cn } from "../lib/utils";

interface JsonTreeProps {
  data: unknown;
  maxDepth?: number;
  maxStringLength?: number;
  className?: string;
}

const JsonTree = React.forwardRef<HTMLDivElement, JsonTreeProps>(
  ({ data, maxDepth = 4, maxStringLength = 300, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "font-mono text-xs leading-relaxed bg-muted border border-border rounded-md p-3 max-h-[400px] overflow-auto whitespace-pre-wrap break-all",
          className,
        )}
      >
        <JsonNode data={data} depth={0} maxDepth={maxDepth} maxStringLength={maxStringLength} />
      </div>
    );
  },
);
JsonTree.displayName = "JsonTree";

export { JsonTree };

/* ---------- Internal ---------- */

interface JsonNodeProps {
  data: unknown;
  depth: number;
  maxDepth: number;
  maxStringLength: number;
}

function JsonNode({ data, depth, maxDepth, maxStringLength }: JsonNodeProps) {
  if (depth > maxDepth) {
    return <span className="text-muted-foreground italic">... (depth limit)</span>;
  }

  if (data === null) {
    return <span className="text-muted-foreground italic">null</span>;
  }

  if (typeof data === "boolean") {
    return <span className="text-[oklch(0.55_0.25_300)]">{String(data)}</span>;
  }

  if (typeof data === "number") {
    return <span className="text-primary">{String(data)}</span>;
  }

  if (typeof data === "string") {
    return <JsonString value={data} maxStringLength={maxStringLength} />;
  }

  if (Array.isArray(data)) {
    return <JsonArray data={data} depth={depth} maxDepth={maxDepth} maxStringLength={maxStringLength} />;
  }

  if (typeof data === "object") {
    return (
      <JsonObject
        data={data as Record<string, unknown>}
        depth={depth}
        maxDepth={maxDepth}
        maxStringLength={maxStringLength}
      />
    );
  }

  return <span>{String(data)}</span>;
}

/* ---------- JsonString ---------- */

function JsonString({ value, maxStringLength }: { value: string; maxStringLength: number }) {
  const [expanded, setExpanded] = React.useState(false);

  if (value.length > maxStringLength && !expanded) {
    return (
      <span
        className="text-[oklch(0.55_0.17_155)] cursor-pointer"
        onClick={() => setExpanded(true)}
        title={value}
      >
        &quot;{value.slice(0, maxStringLength)}...&quot;
      </span>
    );
  }

  return (
    <span className="text-[oklch(0.55_0.17_155)]">&quot;{value}&quot;</span>
  );
}

/* ---------- JsonObject ---------- */

function JsonObject({
  data,
  depth,
  maxDepth,
  maxStringLength,
}: {
  data: Record<string, unknown>;
  depth: number;
  maxDepth: number;
  maxStringLength: number;
}) {
  const entries = Object.entries(data);
  const [collapsed, setCollapsed] = React.useState(false);

  if (entries.length === 0) {
    return <span className="text-muted-foreground">{"{}"}</span>;
  }

  return (
    <>
      <span
        className="text-muted-foreground cursor-pointer select-none inline-block w-3.5 text-center"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "▶" : "▼"}
      </span>
      <span className="text-muted-foreground">{"{"}</span>
      {!collapsed && (
        <div className="pl-4">
          {entries.map(([key, value], i) => (
            <div key={key}>
              <span className="text-muted-foreground">&quot;{key}&quot;: </span>
              <JsonNode
                data={value}
                depth={depth + 1}
                maxDepth={maxDepth}
                maxStringLength={maxStringLength}
              />
              {i < entries.length - 1 && <span className="text-muted-foreground">,</span>}
            </div>
          ))}
        </div>
      )}
      {collapsed && (
        <span className="text-muted-foreground italic"> ... </span>
      )}
      <span className="text-muted-foreground">{"}"}</span>
    </>
  );
}

/* ---------- JsonArray ---------- */

function JsonArray({
  data,
  depth,
  maxDepth,
  maxStringLength,
}: {
  data: unknown[];
  depth: number;
  maxDepth: number;
  maxStringLength: number;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  if (data.length === 0) {
    return <span className="text-muted-foreground">{"[]"}</span>;
  }

  return (
    <>
      <span
        className="text-muted-foreground cursor-pointer select-none inline-block w-3.5 text-center"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "▶" : "▼"}
      </span>
      <span className="text-muted-foreground">{"["}</span>
      {!collapsed && (
        <div className="pl-4">
          {data.map((value, i) => (
            <div key={i}>
              <JsonNode
                data={value}
                depth={depth + 1}
                maxDepth={maxDepth}
                maxStringLength={maxStringLength}
              />
              {i < data.length - 1 && <span className="text-muted-foreground">,</span>}
            </div>
          ))}
        </div>
      )}
      {collapsed && (
        <span className="text-muted-foreground italic"> ... </span>
      )}
      <span className="text-muted-foreground">{"]"}</span>
    </>
  );
}
