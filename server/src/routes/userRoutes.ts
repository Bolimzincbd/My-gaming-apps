import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { User } from "../models/User";
import { Review } from "../models/Review";
import { Report } from "../models/Report";
import { HttpError } from "../utils/httpError";
import { toPublicUser } from "../utils/users";
import { MLBB_AVAILABILITY, MLBB_LANES, MLBB_PLAYSTYLES, MLBB_ROLES } from "../utils/mlbb";

const router = Router();

const profileSchema = z.object({
  avatar: z.string().url().or(z.literal("")),
  bio: z.string().max(400),
  preferredGames: z.array(z.string()).min(1),
  preferredModes: z.array(z.string()),
  gameRanks: z.array(
    z.object({
      game: z.string(),
      rank: z.string(),
      rankValue: z.number().min(1).max(10)
    })
  ),
  region: z.string(),
  languages: z.array(z.string()).min(1),
  playstyle: z.enum(MLBB_PLAYSTYLES as [string, ...string[]]),
  mlbbRole: z.enum(MLBB_ROLES as [string, ...string[]]),
  mlbbLane: z.enum(MLBB_LANES as [string, ...string[]]),
  availability: z.enum(MLBB_AVAILABILITY as [string, ...string[]]),
  trustScore: z.number().min(0).max(100).optional(),
  winRate: z.number().min(0).max(100)
});

const reportSchema = z.object({
  reason: z.string().min(10).max(300)
});

router.get("/:id", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  const reviews = await Review.find({ sellerId: user._id }).sort({ createdAt: -1 }).limit(5);
  res.json({ user: toPublicUser(user), reviews });
}));

router.put("/me/profile", requireAuth, asyncHandler(async (req, res) => {
  const payload = profileSchema.parse(req.body);
  const user = await User.findById(req.user!.userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  Object.assign(user, payload, { lastActive: new Date() });
  await user.save();
  res.json({ user: toPublicUser(user) });
}));

router.post("/:id/report", requireAuth, asyncHandler(async (req, res) => {
  const payload = reportSchema.parse(req.body);
  if (req.params.id === req.user!.userId) {
    throw new HttpError(400, "You cannot report yourself");
  }
  await Report.create({
    reporterId: req.user!.userId,
    targetType: "user",
    targetId: req.params.id,
    reason: payload.reason
  });
  res.status(201).json({ message: "User report submitted for moderation" });
}));

export default router;
