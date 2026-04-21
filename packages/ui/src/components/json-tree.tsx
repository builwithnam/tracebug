import * as React from "react";
import { cn } from "../lib/utils";

interface JsonTreeProps {
  data: unknown;
  maxDepth?: number;
  maxStringLength?: number;
  className?: string;
}

const JsonTree = React.forwardRef<HTMLDivElement, JsonTreeProps>(
  ({ data, maxDepth = 10, maxStringLength = 300, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "font-mono text-xs leading-relaxed bg-card border border-border rounded-lg p-4 max-h-[500px] overflow-auto",
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
    return <span className="text-foreground-secondary italic">... (depth limit)</span>;
  }

  if (data === null) {
    return <span className="text-destructive font-medium">null</span>;
  }

  if (typeof data === "boolean") {
    return <span className="text-primary font-semibold">{String(data)}</span>;
  }

  if (typeof data === "number") {
    return <span className="text-accent font-semibold">{String(data)}</span>;
  }

  if (typeof data === "string") {
    return <JsonString value={data} maxStringLength={maxStringLength} />;
  }

  if (Array.isArray(data)) {
    return (
      <JsonArray
        data={data}
        depth={depth}
        maxDepth={maxDepth}
        maxStringLength={maxStringLength}
      />
    );
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
        className="text-success font-medium cursor-pointer hover:text-success-dim transition-colors"
        onClick={() => setExpanded(true)}
        title={value}
      >
        &quot;{value.slice(0, maxStringLength)}...&quot;
      </span>
    );
  }

  return (
    <span className="text-success font-medium">&quot;{value}&quot;</span>
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
  const indent = (depth + 1) * 2;

  if (entries.length === 0) {
    return <span className="text-foreground font-medium">{"{}"}</span>;
  }

  return (
    <>
      <span
        className={cn(
          "text-foreground cursor-pointer select-none inline-block w-4 text-center transition-transform duration-200 hover:text-primary",
          collapsed ? "rotate-0" : "rotate-90",
        )}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Click to expand" : "Click to collapse"}
      >
        ▶
      </span>
      <span className="text-foreground font-medium">{"{"}</span>
      {!collapsed && (
        <div>
          {entries.map(([key, value], i) => (
            <div
              key={key}
              className="hover:bg-muted/50 -mx-2 px-2 py-0.5 rounded-md transition-colors"
              style={{ marginLeft: `${indent}ch` }}
            >
              <span className="text-primary font-semibold">&quot;{key}&quot;</span>
              <span className="text-foreground font-medium mx-1">:</span>
              <JsonNode
                data={value}
                depth={depth + 1}
                maxDepth={maxDepth}
                maxStringLength={maxStringLength}
              />
              <span className="text-foreground mx-0.5">
                {i < entries.length - 1 ? "," : ""}
              </span>
            </div>
          ))}
        </div>
      )}
      {collapsed && (
        <span className="text-foreground-secondary italic mx-2">{entries.length} keys...</span>
      )}
      <span className="text-foreground font-medium">{"}"}</span>
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
  const indent = (depth + 1) * 2;

  if (data.length === 0) {
    return <span className="text-foreground font-medium">{"[]"}</span>;
  }

  return (
    <>
      <span
        className={cn(
          "text-foreground cursor-pointer select-none inline-block w-4 text-center transition-transform duration-200 hover:text-primary",
          collapsed ? "rotate-0" : "rotate-90",
        )}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Click to expand" : "Click to collapse"}
      >
        ▶
      </span>
      <span className="text-foreground font-medium">{"["}</span>
      {!collapsed && (
        <div>
          {data.map((value, i) => (
            <div
              key={i}
              className="hover:bg-muted/50 -mx-2 px-2 py-0.5 rounded-md transition-colors"
              style={{ marginLeft: `${indent}ch` }}
            >
              <JsonNode
                data={value}
                depth={depth + 1}
                maxDepth={maxDepth}
                maxStringLength={maxStringLength}
              />
              <span className="text-foreground mx-0.5">
                {i < data.length - 1 ? "," : ""}
              </span>
            </div>
          ))}
        </div>
      )}
      {collapsed && (
        <span className="text-foreground-secondary italic mx-2">{data.length} items...</span>
      )}
      <span className="text-foreground font-medium">{"]"}</span>
    </>
  );
}
