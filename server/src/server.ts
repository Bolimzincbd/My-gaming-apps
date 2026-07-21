import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { connectDatabase } from "./db/connect";
import { env } from "./config/env";
import { verifyToken } from "./utils/jwt";
import { ChatRoom } from "./models/ChatRoom";
import { Message } from "./models/Message";

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true
    }
  });

  app.set("io", io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication token missing"));
      }
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user.userId as string;
    socket.join(`user:${userId}`);

    socket.on("room:join", async (roomId: string) => {
      const room = await ChatRoom.findById(roomId);
      if (!room) return;
      const allowed = room.participantIds.some((participantId: any) => participantId.toString() === userId);
      if (!allowed) return;
      socket.join(`room:${roomId}`);
    });

    socket.on("typing", (payload: { roomId: string; isTyping: boolean }) => {
      socket.to(`room:${payload.roomId}`).emit("typing", { userId, isTyping: payload.isTyping });
    });

    socket.on("message:send", async (payload: { roomId: string; content: string }) => {
      const room = await ChatRoom.findById(payload.roomId);
      if (!room) return;
      const allowed = room.participantIds.some((participantId: any) => participantId.toString() === userId);
      if (!allowed || !payload.content.trim()) return;

      const message = await Message.create({ roomId: payload.roomId, senderId: userId, content: payload.content.trim() });
      const populated = await message.populate("senderId", "username avatar");
      io.to(`room:${payload.roomId}`).emit("message:new", populated);
    });
  });

  server.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
