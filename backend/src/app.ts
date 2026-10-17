import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health.routes";
import { requirementRouter } from "./routes/requirement.routes";

export type AppOptions = {
  corsOrigins: string[];
  nodeEnv?: "development" | "production" | "test";
};

export function createApp({ corsOrigins, nodeEnv = "development" }: AppOptions) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Render terminates TLS in front of the app

  app.use(helmet());
  app.use(
    cors({
      // Requests without an Origin header (curl, server-to-server, health checks) are allowed;
      // browsers are only allowed from the configured frontend origins.
      origin: (origin, callback) => callback(null, !origin || corsOrigins.includes(origin)),
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Idempotency-Key"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  if (nodeEnv !== "test") app.use(morgan(nodeEnv === "production" ? "combined" : "dev"));

  app.use("/api/health", healthRouter);
  app.use("/api/requirements", requirementRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
