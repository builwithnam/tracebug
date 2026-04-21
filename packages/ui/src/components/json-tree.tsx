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
          "font-mono text-xs leading-relaxed bg-card border border-border rounded-lg p-4 max-h-[500px] overflow-auto whitespace-pre-wrap break-all",
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
    return <span className="text-foreground-tertiary italic">... (depth limit)</span>;
  }

  if (data === null) {
    return <span className="text-foreground-tertiary italic">null</span>;
  }

  if (typeof data === "boolean") {
    return <span className="text-primary font-medium">{String(data)}</span>;
  }

  if (typeof data === "number") {
    return <span className="text-info font-medium">{String(data)}</span>;
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
        className="text-success cursor-pointer hover:text-primary transition-colors"
        onClick={() => setExpanded(true)}
        title={value}
      >
        &quot;{value.slice(0, maxStringLength)}...&quot;
      </span>
    );
  }

  return (
    <span className="text-success">&quot;{value}&quot;</span>
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
    return <span className="text-foreground-tertiary">{"{}"}</span>;
  }

  return (
    <>
      <span
        className={cn(
          "text-foreground-secondary cursor-pointer select-none inline-block w-4 text-center transition-transform duration-200 hover:text-foreground",
          collapsed ? "rotate-0" : "rotate-90",
        )}
        onClick={() => setCollapsed(!collapsed)}
      >
        ▶
      </span>
      <span className="text-foreground-tertiary">{"{"}</span>
      {!collapsed && (
        <div className="pl-5">
          {entries.map(([key, value], i) => (
            <div
              key={key}
              className="hover:bg-muted/30 -mx-2 px-2 py-0.5 rounded-md transition-colors"
            >
              <span className="text-info font-medium">&quot;{key}&quot;</span>
              <span className="text-foreground-tertiary mx-1">:</span>
              <JsonNode
                data={value}
                depth={depth + 1}
                maxDepth={maxDepth}
                maxStringLength={maxStringLength}
              />
              <span className="text-foreground-tertiary/50 mx-0.5">
                {i < entries.length - 1 ? "," : ""}
              </span>
            </div>
          ))}
        </div>
      )}
      {collapsed && (
        <span className="text-foreground-tertiary italic mx-1">... {entries.length} keys</span>
      )}
      <span className="text-foreground-tertiary">{"}"}</span>
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
    return <span className="text-foreground-tertiary">{"[]"}</span>;
  }

  return (
    <>
      <span
        className={cn(
          "text-foreground-secondary cursor-pointer select-none inline-block w-4 text-center transition-transform duration-200 hover:text-foreground",
          collapsed ? "rotate-0" : "rotate-90",
        )}
        onClick={() => setCollapsed(!collapsed)}
      >
        ▶
      </span>
      <span className="text-foreground-tertiary">{"["}</span>
      {!collapsed && (
        <div className="pl-5">
          {data.map((value, i) => (
            <div
              key={i}
              className="hover:bg-muted/30 -mx-2 px-2 py-0.5 rounded-md transition-colors"
            >
              <JsonNode
                data={value}
                depth={depth + 1}
                maxDepth={maxDepth}
                maxStringLength={maxStringLength}
              />
              <span className="text-foreground-tertiary/50 mx-0.5">
                {i < data.length - 1 ? "," : ""}
              </span>
            </div>
          ))}
        </div>
      )}
      {collapsed && (
        <span className="text-foreground-tertiary italic mx-1">... {data.length} items</span>
      )}
      <span className="text-foreground-tertiary">{"]"}</span>
    </>
  );
}
