import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import gameRoutes from "./routes/gameRoutes";
import userRoutes from "./routes/userRoutes";
import matcherRoutes from "./routes/matcherRoutes";
import chatRoutes from "./routes/chatRoutes";
import marketRoutes from "./routes/marketRoutes";
import adminRoutes from "./routes/adminRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { errorHandler, notFound } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "game-matcher-market-server" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/games", gameRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/matcher", matcherRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/market", marketRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/notifications", notificationRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
