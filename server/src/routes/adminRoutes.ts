import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/User";
import { Match } from "../models/Match";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { Report } from "../models/Report";
import { HttpError } from "../utils/httpError";

const router = Router();

const reportStatusSchema = z.object({ status: z.enum(["pending", "reviewed", "resolved"]) });
const listingStatusSchema = z.object({ status: z.enum(["active", "paused", "sold", "flagged"]) });
const roleSchema = z.object({ role: z.enum(["user", "seller", "admin"]) });

router.use(requireAuth, requireRole(["admin"]));

router.get("/overview", asyncHandler(async (_req, res) => {
  const [users, activeMatches, products, orders, reports, disputedOrders, escrowSecured] = await Promise.all([
    User.countDocuments(),
    Match.countDocuments({ status: "active" }),
    Product.countDocuments(),
    Order.countDocuments(),
    Report.countDocuments(),
    Order.countDocuments({ escrowStatus: "disputed" }),
    Order.countDocuments({ escrowStatus: { $in: ["escrow_secured", "seller_delivering", "delivered", "buyer_confirmed"] } })
  ]);

  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
  const recentReports = await Report.find().sort({ createdAt: -1 }).limit(5);

  res.json({ metrics: { users, activeMatches, products, orders, reports, disputedOrders, escrowSecured }, recentUsers, recentReports });
}));

router.get("/users", asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
}));

router.get("/listings", asyncHandler(async (_req, res) => {
  const listings = await Product.find().sort({ createdAt: -1 }).populate("sellerId", "username email sellerRating role");
  res.json({ listings });
}));

router.get("/reports", asyncHandler(async (_req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 }).populate("reporterId", "username email role");
  res.json({ reports });
}));

router.get("/orders", asyncHandler(async (_req, res) => {
  const orders = await Order.find()
    .sort({ updatedAt: -1 })
    .limit(80)
    .populate("buyerId", "username email")
    .populate("items.sellerId", "username email sellerRating");
  res.json({ orders });
}));

router.patch("/reports/:id", asyncHandler(async (req, res) => {
  const payload = reportStatusSchema.parse(req.body);
  const report = await Report.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!report) {
    throw new HttpError(404, "Report not found");
  }
  res.json({ report });
}));

router.patch("/listings/:id", asyncHandler(async (req, res) => {
  const payload = listingStatusSchema.parse(req.body);
  const listing = await Product.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!listing) {
    throw new HttpError(404, "Listing not found");
  }
  res.json({ listing });
}));

router.patch("/users/:id/role", asyncHandler(async (req, res) => {
  const payload = roleSchema.parse(req.body);
  const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  res.json({ user });
}));

export default router;
