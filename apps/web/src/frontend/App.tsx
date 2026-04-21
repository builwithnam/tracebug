import { useState, useCallback } from "react";
import { LandingView } from "./views/LandingView";
import { SessionView } from "./views/SessionView";
import type { SessionResponse } from "@tracebug/core";

export function App() {
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);

  const handleLoad = useCallback((data: SessionResponse) => {
    setSessionData(data);
  }, []);

  const handleBack = useCallback(() => {
    setSessionData(null);
  }, []);

  if (sessionData) {
    return <SessionView data={sessionData} onBack={handleBack} />;
  }

  return <LandingView onLoad={handleLoad} />;
}
