"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Button } from "@tracebug/ui";

export default function LandingPage() {
  const router = useRouter();
  const [shareId, setShareId] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = shareId.trim();
    if (!id) {
      setError("Please enter a share ID");
      return;
    }
    router.push(`/session?share_id=${encodeURIComponent(id)}`);
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
            <div className="flex flex-col gap-2">
              <label
                htmlFor="share-id"
                className="text-xs font-medium uppercase tracking-[0.1em] text-foreground-tertiary"
              >
                Share ID
              </label>
              <Input
                id="share-id"
                value={shareId}
                onChange={(e) => setShareId(e.target.value)}
                placeholder="Enter your share ID..."
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
