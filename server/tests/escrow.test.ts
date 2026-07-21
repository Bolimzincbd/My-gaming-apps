import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Express } from "express";
import { User } from "../src/models/User";
import { MLBB_GAME } from "../src/utils/mlbb";

let mongoServer: MongoMemoryServer;
let app: Express;
let connectDatabase: (uri?: string) => Promise<unknown>;
let disconnectDatabase: () => Promise<void>;

async function register(role: "user" | "seller", username: string, email: string) {
  const response = await request(app).post("/api/auth/register").send({
    username,
    email,
    password: "Password123!",
    region: "Cambodia",
    languages: ["English", "Khmer"],
    playstyle: "Objective-focused",
    mlbbRole: role === "seller" ? "Mage" : "Marksman",
    mlbbLane: role === "seller" ? "Mid Lane" : "Gold Lane",
    availability: "Weekday evenings",
    preferredGames: [MLBB_GAME],
    preferredModes: ["Ranked"],
    gameRanks: [{ game: MLBB_GAME, rank: "Mythic", rankValue: 7 }],
    role
  });
  return response.body.token as string;
}

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

describe("mock escrow order flow", () => {
  it("allows checkout, seller delivery, buyer confirmation, and admin release", async () => {
    const buyerToken = await register("user", "BuyerPilot", "buyer@example.com");
    const sellerToken = await register("seller", "SellerCoach", "seller@example.com");

    const passwordHash = await bcrypt.hash("Password123!", 10);
    await User.create({
      username: "AdminJudge",
      email: "admin@example.com",
      passwordHash,
      avatar: "",
      bio: "Test admin",
      preferredGames: [MLBB_GAME],
      preferredModes: ["Ranked"],
      gameRanks: [{ game: MLBB_GAME, rank: "Mythical Glory", rankValue: 9 }],
      region: "Cambodia",
      languages: ["English"],
      playstyle: "Strategic",
      mlbbRole: "Tank",
      mlbbLane: "Roam",
      availability: "Flexible",
      trustScore: 90,
      role: "admin"
    });

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "Password123!"
    });
    const adminToken = adminLogin.body.token as string;

    const productResponse = await request(app)
      .post("/api/market/products")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        title: "MLBB Replay Review",
        description: "Timestamped replay review for turtle, lord, wave, and rotation mistakes.",
        game: MLBB_GAME,
        category: "Replay Review",
        listingType: "service",
        price: 18,
        images: ["/images/products/mlbb-review.svg"],
        status: "active",
        stock: 2,
        deliveryTimeHours: 24,
        escrowEligible: true,
        tags: ["replay"]
      });

    expect(productResponse.status).toBe(201);
    const productId = productResponse.body.product._id as string;

    await request(app)
      .post("/api/market/cart/items")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId, quantity: 1 })
      .expect(200);

    const checkoutResponse = await request(app)
      .post("/api/market/checkout")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ paymentMethod: "Mock secure wallet" });

    expect(checkoutResponse.status).toBe(201);
    expect(checkoutResponse.body.order.escrowStatus).toBe("escrow_secured");
    expect(checkoutResponse.body.order.statusHistory.map((entry: any) => entry.status)).toContain("pending_payment");
    const orderId = checkoutResponse.body.order._id as string;

    await request(app)
      .post(`/api/market/orders/${orderId}/admin-release`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ note: "Seller should not release funds." })
      .expect(403);

    const delivered = await request(app)
      .post(`/api/market/orders/${orderId}/seller-delivered`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ note: "Delivered replay notes." });
    expect(delivered.status).toBe(200);
    expect(delivered.body.order.escrowStatus).toBe("delivered");

    const confirmed = await request(app)
      .post(`/api/market/orders/${orderId}/buyer-confirm`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ note: "Received the notes." });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.order.escrowStatus).toBe("buyer_confirmed");

    const released = await request(app)
      .post(`/api/market/orders/${orderId}/admin-release`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ note: "Teacher demo release." });
    expect(released.status).toBe(200);
    expect(released.body.order.escrowStatus).toBe("released_to_seller");
    expect(released.body.order.paymentStatusMock).toBe("released");

    await request(app)
      .post("/api/market/cart/items")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId, quantity: 1 })
      .expect(200);

    const disputeCheckout = await request(app)
      .post("/api/market/checkout")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ paymentMethod: "Mock secure wallet" });
    expect(disputeCheckout.status).toBe(201);
    const disputedOrderId = disputeCheckout.body.order._id as string;

    const delivering = await request(app)
      .post(`/api/market/orders/${disputedOrderId}/seller-delivering`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ note: "Seller started review delivery." });
    expect(delivering.status).toBe(200);
    expect(delivering.body.order.escrowStatus).toBe("seller_delivering");

    const disputed = await request(app)
      .post(`/api/market/orders/${disputedOrderId}/dispute`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ reason: "Delivery details do not match the expected MLBB replay review." });
    expect(disputed.status).toBe(200);
    expect(disputed.body.order.escrowStatus).toBe("disputed");
    expect(disputed.body.order.disputeReason).toContain("MLBB replay review");

    const refunded = await request(app)
      .post(`/api/market/orders/${disputedOrderId}/admin-refund`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ note: "Teacher demo refund after buyer dispute." });
    expect(refunded.status).toBe(200);
    expect(refunded.body.order.escrowStatus).toBe("refunded_to_buyer");
    expect(refunded.body.order.paymentStatusMock).toBe("refunded");
  });
});
