import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const chatRoomSchema = new Schema(
  {
    participantIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true }
  },
  { timestamps: true }
);

export type ChatRoomShape = InferSchemaType<typeof chatRoomSchema>;
export type IChatRoom = HydratedDocument<ChatRoomShape>;
export const ChatRoom = models.ChatRoom || model("ChatRoom", chatRoomSchema);
