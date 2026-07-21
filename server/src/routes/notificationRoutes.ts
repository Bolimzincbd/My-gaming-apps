import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { Notification } from "../models/Notification";

const router = Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(12);
  res.json({ notifications });
}));

export default router;
