import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.SERVER_PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/game-matcher-market",
  jwtSecret: process.env.JWT_SECRET ?? "development-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development"
};
