import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";
import { toPublicUser } from "../utils/users";
import { HttpError } from "../utils/httpError";
import { requireAuth } from "../middleware/auth";
import { MLBB_AVAILABILITY, MLBB_LANES, MLBB_PLAYSTYLES, MLBB_ROLES } from "../utils/mlbb";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(24),
  email: z.string().email(),
  password: z.string().min(8),
  region: z.string().min(2),
  languages: z.array(z.string()).min(1),
  playstyle: z.enum(MLBB_PLAYSTYLES as [string, ...string[]]),
  mlbbRole: z.enum(MLBB_ROLES as [string, ...string[]]).default("Mage"),
  mlbbLane: z.enum(MLBB_LANES as [string, ...string[]]).default("Mid Lane"),
  availability: z.enum(MLBB_AVAILABILITY as [string, ...string[]]).default("Flexible"),
  trustScore: z.number().min(0).max(100).optional(),
  preferredGames: z.array(z.string()).min(1),
  preferredModes: z.array(z.string()).default([]),
  gameRanks: z.array(
    z.object({
      game: z.string(),
      rank: z.string(),
      rankValue: z.number().min(1).max(10)
    })
  ).min(1),
  role: z.enum(["user", "seller"]).default("user"),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  winRate: z.number().min(0).max(100).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post("/register", asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const existing = await User.findOne({
    $or: [{ email: payload.email.toLowerCase() }, { username: payload.username }]
  });

  if (existing) {
    throw new HttpError(409, "User with that email or username already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await User.create({
    ...payload,
    email: payload.email.toLowerCase(),
    passwordHash,
    avatar: payload.avatar ?? "",
    bio: payload.bio ?? "",
    winRate: payload.winRate ?? 50,
    trustScore: payload.trustScore ?? 70,
    lastActive: new Date()
  });

  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.status(201).json({ token, user: toPublicUser(user) });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password");
  }

  user.lastActive = new Date();
  await user.save();

  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.json({ token, user: toPublicUser(user) });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  res.json({ user: toPublicUser(user) });
}));

export default router;
