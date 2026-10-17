import type { RequestHandler } from "express";
import { databaseStatus, isDatabaseConnected } from "../config/db";

/** GET /api/health — 200 when the API and database are both up, 503 when the database is not. */
export const getHealth: RequestHandler = (_req, res) => {
  const healthy = isDatabaseConnected();
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? "ok" : "degraded",
      database: databaseStatus(),
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};
