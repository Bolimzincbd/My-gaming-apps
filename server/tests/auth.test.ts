import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Express } from "express";
import { MLBB_GAME } from "../src/utils/mlbb";

let mongoServer: MongoMemoryServer;
let app: Express;
let connectDatabase: (uri?: string) => Promise<unknown>;
let disconnectDatabase: () => Promise<void>;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  ({ connectDatabase, disconnectDatabase } = await import("../src/db/connect"));
  await connectDatabase(process.env.MONGODB_URI);
  app = (await import("../src/app")).createApp();
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

describe("auth flow", () => {
  it("registers, logs in, and returns the current user", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({
      username: "TestPilot",
      email: "testpilot@example.com",
      password: "Password123!",
      region: "Cambodia",
      languages: ["English", "Khmer"],
      playstyle: "Objective-focused",
      mlbbRole: "Marksman",
      mlbbLane: "Gold Lane",
      availability: "Weekday evenings",
      trustScore: 80,
      preferredGames: [MLBB_GAME],
      preferredModes: ["Ranked"],
      gameRanks: [{ game: MLBB_GAME, rank: "Mythic", rankValue: 7 }],
      role: "user"
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.token).toBeTruthy();

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "testpilot@example.com",
      password: "Password123!"
    });

    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token as string;

    const meResponse = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.username).toBe("TestPilot");
    expect(meResponse.body.user.mlbbLane).toBe("Gold Lane");
  });
});
