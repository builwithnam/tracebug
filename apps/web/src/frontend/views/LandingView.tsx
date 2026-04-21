import { useState, type FormEvent } from "react";
import { Card, CardContent, Input, Button } from "@tracebug/ui";

interface LandingViewProps {
  onLoad: (data: import("@tracebug/core").SessionResponse) => void;
}

export function LandingView({ onLoad }: LandingViewProps) {
  const [shareId, setShareId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.slice(1);
    return params.get("share_id") || hash || "";
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = shareId.trim();
    if (!id) {
      setError("Please enter a share ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/session?share_id=${encodeURIComponent(id)}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Session not found" : `Server error: ${res.status}`);
      }
      const data = await res.json();
      onLoad(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[440px] text-center p-12 px-10 border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <h1 className="text-[32px] font-medium tracking-tight text-foreground">tracebug</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inspect LangChain pipeline traces</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <Input
            value={shareId}
            onChange={(e) => setShareId(e.target.value)}
            placeholder="Enter share ID"
            autoComplete="off"
            spellCheck={false}
            className="h-10 text-base"
          />
          <Button type="submit" disabled={loading} className="h-10 text-base w-full">
            {loading ? "Loading..." : "Load Session"}
          </Button>
        </form>

        <div className="mt-3 text-sm text-destructive min-h-5">{error}</div>
      </Card>
    </div>
  );
}
