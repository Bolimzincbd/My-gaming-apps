import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Game } from "../models/Game";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  const games = await Game.find().sort({ name: 1 });
  res.json({ games });
}));

export default router;
