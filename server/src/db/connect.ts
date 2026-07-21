import mongoose from "mongoose";
import { env } from "../config/env";

export async function connectDatabase(uri = env.mongoUri) {
  mongoose.set("strictQuery", true);
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  return mongoose.connect(uri);
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
