import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";
import { MatchRequest } from "../models/MatchRequest";
import { Match } from "../models/Match";
import { ChatRoom } from "../models/ChatRoom";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { calculateMatchScore, rankCandidates } from "../utils/matchmaking";
import { MLBB_AVAILABILITY, MLBB_LANES, MLBB_PLAYSTYLES, MLBB_ROLES } from "../utils/mlbb";

const router = Router();

const scoreSchema = z.object({
  total: z.number(),
  rank: z.number(),
  role: z.number(),
  lane: z.number(),
  region: z.number(),
  language: z.number(),
  mode: z.number(),
  playstyle: z.number(),
  availability: z.number(),
  trust: z.number(),
  activity: z.number(),
  tags: z.array(z.string())
});

const suggestionSchema = z.object({
  game: z.string().min(1),
  rankValue: z.coerce.number().min(1).max(10).optional(),
  region: z.string().optional(),
  language: z.string().optional(),
  mode: z.string().optional(),
  playstyle: z.enum(MLBB_PLAYSTYLES as [string, ...string[]]).optional(),
  mlbbRole: z.enum(MLBB_ROLES as [string, ...string[]]).optional(),
  mlbbLane: z.enum(MLBB_LANES as [string, ...string[]]).optional(),
  availability: z.enum(MLBB_AVAILABILITY as [string, ...string[]]).optional()
});

const createRequestSchema = z.object({
  targetUserId: z.string(),
  targetGame: z.string(),
  desiredRank: z.string(),
  desiredRankValue: z.number().min(1).max(10),
  region: z.string(),
  language: z.string(),
  mode: z.string(),
  playstyle: z.enum(MLBB_PLAYSTYLES as [string, ...string[]]),
  mlbbRole: z.enum(MLBB_ROLES as [string, ...string[]]),
  mlbbLane: z.enum(MLBB_LANES as [string, ...string[]]),
  availability: z.enum(MLBB_AVAILABILITY as [string, ...string[]]),
  scoreBreakdown: scoreSchema.optional()
});

const respondSchema = z.object({
  action: z.enum(["accepted", "declined"])
});

router.get("/suggestions", requireAuth, asyncHandler(async (req, res) => {
  const filters = suggestionSchema.parse(req.query);
  const currentUser = await User.findById(req.user!.userId);
  if (!currentUser) {
    throw new HttpError(404, "User not found");
  }

  const candidates = await User.find({ _id: { $ne: currentUser._id }, preferredGames: filters.game });
  const ranked = rankCandidates(currentUser.toObject() as any, candidates.map((candidate) => candidate.toObject() as any), filters)
    .map(({ candidate, scoreBreakdown }) => ({
      user: {
        id: candidate._id?.toString(),
        username: candidate.username,
        avatar: (candidate as any).avatar,
        region: candidate.region,
        languages: candidate.languages,
        playstyle: candidate.playstyle,
        mlbbRole: candidate.mlbbRole,
        mlbbLane: candidate.mlbbLane,
        availability: candidate.availability,
        trustScore: candidate.trustScore,
        preferredModes: candidate.preferredModes,
        gameRank: candidate.gameRanks.find((entry) => entry.game === filters.game),
        sellerRating: candidate.sellerRating
      },
      scoreBreakdown
    }))
    .slice(0, 12);

  res.json({ results: ranked });
}));

router.get("/requests", requireAuth, asyncHandler(async (req, res) => {
  const incoming = await MatchRequest.find({ targetUserId: req.user!.userId })
    .populate("requesterId", "username avatar region languages playstyle mlbbRole mlbbLane availability trustScore")
    .sort({ createdAt: -1 });
  const outgoing = await MatchRequest.find({ requesterId: req.user!.userId })
    .populate("targetUserId", "username avatar region languages playstyle mlbbRole mlbbLane availability trustScore")
    .sort({ createdAt: -1 });
  res.json({ incoming, outgoing });
}));

router.post("/requests", requireAuth, asyncHandler(async (req, res) => {
  const payload = createRequestSchema.parse(req.body);
  if (payload.targetUserId === req.user!.userId) {
    throw new HttpError(400, "You cannot send a match request to yourself");
  }

  const duplicate = await MatchRequest.findOne({
    requesterId: req.user!.userId,
    targetUserId: payload.targetUserId,
    targetGame: payload.targetGame,
    status: "pending"
  });
  if (duplicate) {
    throw new HttpError(409, "A pending request already exists for this player and game");
  }

  const matchRequest = await MatchRequest.create({
    requesterId: req.user!.userId,
    ...payload
  });

  await Notification.create({
    userId: payload.targetUserId,
    type: "match-request",
    content: `You received a new ${payload.targetGame} teammate request.`,
    link: "/matcher"
  });

  req.app.get("io")?.to(`user:${payload.targetUserId}`).emit("notification:new", {
    type: "match-request",
    content: `You received a new ${payload.targetGame} teammate request.`,
    link: "/matcher"
  });

  res.status(201).json({ matchRequest });
}));

router.post("/requests/:id/respond", requireAuth, asyncHandler(async (req, res) => {
  const payload = respondSchema.parse(req.body);
  const request = await MatchRequest.findById(req.params.id);
  if (!request) {
    throw new HttpError(404, "Match request not found");
  }
  if (request.targetUserId.toString() !== req.user!.userId) {
    throw new HttpError(403, "You can only respond to your own incoming requests");
  }
  if (request.status !== "pending") {
    throw new HttpError(400, "This match request has already been handled");
  }

  request.status = payload.action;
  await request.save();

  if (payload.action === "declined") {
    await Notification.create({
      userId: request.requesterId,
      type: "match-declined",
      content: "Your teammate request was declined.",
      link: "/matcher"
    });
    return res.json({ request, match: null });
  }

  const requester = await User.findById(request.requesterId);
  const target = await User.findById(request.targetUserId);
  if (!requester || !target) {
    throw new HttpError(404, "One of the players is no longer available");
  }

  const scoreBreakdown = calculateMatchScore(requester.toObject() as any, target.toObject() as any, {
    game: request.targetGame,
    rankValue: request.desiredRankValue,
    region: request.region,
    language: request.language,
    mode: request.mode,
    playstyle: request.playstyle,
    mlbbRole: request.mlbbRole,
    mlbbLane: request.mlbbLane,
    availability: request.availability
  });

  const match = await Match.create({
    userIds: [request.requesterId, request.targetUserId],
    game: request.targetGame,
    scoreBreakdown,
    status: "active"
  });

  const room = await ChatRoom.create({
    participantIds: [request.requesterId, request.targetUserId],
    matchId: match._id
  });

  match.chatRoomId = room._id;
  await match.save();

  await Notification.create([
    {
      userId: request.requesterId,
      type: "match-accepted",
      content: `Your ${request.targetGame} teammate request was accepted.`,
      link: `/matches/${match._id.toString()}/chat`
    },
    {
      userId: request.targetUserId,
      type: "match-ready",
      content: `Chat room ready for your ${request.targetGame} match.`,
      link: `/matches/${match._id.toString()}/chat`
    }
  ]);

  for (const userId of [request.requesterId.toString(), request.targetUserId.toString()]) {
    req.app.get("io")?.to(`user:${userId}`).emit("match:accepted", {
      matchId: match._id.toString(),
      chatRoomId: room._id.toString(),
      game: request.targetGame
    });
  }

  res.json({ request, match, chatRoom: room });
}));

router.get("/matches", requireAuth, asyncHandler(async (req, res) => {
  const matches = await Match.find({ userIds: req.user!.userId }).sort({ createdAt: -1 });

  const populated = await Promise.all(matches.map(async (match) => {
    const participants = await User.find(
      { _id: { $in: match.userIds } },
      "username avatar role sellerRating region languages mlbbRole mlbbLane availability trustScore"
    );
    return {
      id: match._id.toString(),
      game: match.game,
      status: match.status,
      scoreBreakdown: match.scoreBreakdown,
      chatRoomId: match.chatRoomId ? match.chatRoomId.toString() : null,
      participants: participants.map((participant) => ({
        id: participant._id.toString(),
        username: participant.username,
        avatar: participant.avatar,
        role: participant.role,
        region: participant.region,
        languages: participant.languages,
        mlbbRole: participant.mlbbRole,
        mlbbLane: participant.mlbbLane,
        availability: participant.availability,
        trustScore: participant.trustScore,
        sellerRating: participant.sellerRating
      })),
      createdAt: match.createdAt
    };
  }));

  res.json({ matches: populated });
}));

export default router;
