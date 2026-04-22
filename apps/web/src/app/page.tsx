"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Button } from "@tracebug/ui";

type LookupMode = "share_id" | "session_id";

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LookupMode>("share_id");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = value.trim();
    if (!id) {
      setError(mode === "share_id" ? "Please enter a share ID" : "Please enter a session ID");
      return;
    }
    router.push(`/session?${mode}=${encodeURIComponent(id)}`);
  }

  function switchMode(newMode: LookupMode) {
    setMode(newMode);
    setValue("");
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[480px] animate-fade-in-up">
        {/* Header - serif for editorial feel */}
        <div className="text-center p-10 pb-8 border-b border-border">
          <h1 className="text-5xl font-serif font-normal text-foreground leading-tight mb-3">
            tracebug
          </h1>
          <p className="text-base text-foreground-secondary leading-relaxed max-w-[280px] mx-auto">
            Inspect LangChain pipeline traces
          </p>
        </div>

        {/* Form */}
        <div className="p-10 pt-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => switchMode("share_id")}
                className={[
                  "flex-1 py-2 text-xs font-medium uppercase tracking-[0.08em] transition-colors duration-200",
                  mode === "share_id"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-foreground-tertiary hover:text-foreground-secondary",
                ].join(" ")}
              >
                Share ID
              </button>
              <button
                type="button"
                onClick={() => switchMode("session_id")}
                className={[
                  "flex-1 py-2 text-xs font-medium uppercase tracking-[0.08em] transition-colors duration-200 border-l border-border",
                  mode === "session_id"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-foreground-tertiary hover:text-foreground-secondary",
                ].join(" ")}
              >
                Session ID
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="lookup-id"
                className="text-xs font-medium uppercase tracking-[0.1em] text-foreground-tertiary"
              >
                {mode === "share_id" ? "Share ID" : "Session ID"}
              </label>
              <Input
                id="lookup-id"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  mode === "share_id" ? "Enter your share ID..." : "Enter your session ID..."
                }
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <Button type="submit" className="h-12 text-base rounded-lg font-medium">
              Load Session
            </Button>
          </form>

          {/* Error */}
          <div className="mt-4 h-6 text-sm text-destructive text-center animate-fade-in">
            {error}
          </div>
        </div>

        {/* Footer - warm, subtle */}
        <div className="px-10 pb-6 text-center">
          <p className="text-xs text-foreground-tertiary">
            A warm, thoughtful debugging companion
          </p>
        </div>
      </Card>
    </div>
  );
}
