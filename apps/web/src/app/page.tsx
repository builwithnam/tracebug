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
          <Button type="submit" className="h-10 text-base w-full">
            Load Session
          </Button>
        </form>

        <div className="mt-3 text-sm text-destructive min-h-5">{error}</div>
      </Card>
    </div>
  );
}
