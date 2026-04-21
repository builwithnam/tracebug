import { Router, type Request, type Response } from "express";
import { messageToResponse, groupTracesByMessageId } from "@tracebug/core";
import { getSessionByShareId, getPool } from "../db.js";

export function sessionRouter(): Router {
  const router = Router();

  router.get("/session", async (req: Request, res: Response) => {
    const shareId = req.query.share_id as string | undefined;

    if (!shareId) {
      res.status(400).json({ error: "share_id is required" });
      return;
    }

    const pool = getPool();

    if (!pool) {
      res.status(500).json({ error: "Database not initialized" });
      return;
    }

    try {
      const session = await getSessionByShareId(pool, shareId);

      if (!session) {
        res.status(404).json({ error: "Share ID not found" });
        return;
      }

      res.json({
        share_id: session.share_id,
        session_id: session.session_id,
        messages: session.messages.map(messageToResponse),
        traces: groupTracesByMessageId(session.traces),
      });
    } catch (error) {
      console.error("handleSession error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
