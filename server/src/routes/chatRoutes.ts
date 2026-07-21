import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { ChatRoom } from "../models/ChatRoom";
import { Message } from "../models/Message";
import { HttpError } from "../utils/httpError";
import { User } from "../models/User";

const router = Router();

const messageSchema = z.object({
  content: z.string().min(1).max(500)
});

async function ensureParticipant(roomId: string, userId: string) {
  const room = await ChatRoom.findById(roomId);
  if (!room) {
    throw new HttpError(404, "Chat room not found");
  }
  if (!room.participantIds.some((participantId: any) => participantId.toString() === userId)) {
    throw new HttpError(403, "You do not have access to this chat room");
  }
  return room;
}

router.get("/rooms/:id", requireAuth, asyncHandler(async (req, res) => {
  const roomId = String(req.params.id);
  const room = await ensureParticipant(roomId, req.user!.userId);
  const participants = await User.find({ _id: { $in: room.participantIds } }, "username avatar region languages role");
  res.json({
    room: {
      id: room._id.toString(),
      matchId: room.matchId.toString(),
      participants: participants.map((participant) => ({
        id: participant._id.toString(),
        username: participant.username,
        avatar: participant.avatar,
        region: participant.region,
        languages: participant.languages,
        role: participant.role
      })),
      createdAt: room.createdAt
    }
  });
}));

router.get("/rooms/:id/messages", requireAuth, asyncHandler(async (req, res) => {
  const roomId = String(req.params.id);
  await ensureParticipant(roomId, req.user!.userId);
  const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).populate("senderId", "username avatar");
  res.json({ messages });
}));

router.post("/rooms/:id/messages", requireAuth, asyncHandler(async (req, res) => {
  const roomId = String(req.params.id);
  await ensureParticipant(roomId, req.user!.userId);
  const payload = messageSchema.parse(req.body);
  const message = await Message.create({ roomId, senderId: req.user!.userId, content: payload.content });
  const populated = await message.populate("senderId", "username avatar");
  req.app.get("io")?.to(`room:${roomId}`).emit("message:new", populated);
  res.status(201).json({ message: populated });
}));

export default router;
