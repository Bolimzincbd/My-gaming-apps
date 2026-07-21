import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const matchSchema = new Schema(
  {
    userIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    game: { type: String, required: true },
    scoreBreakdown: {
      total: Number,
      rank: Number,
      role: Number,
      lane: Number,
      region: Number,
      language: Number,
      mode: Number,
      playstyle: Number,
      availability: Number,
      trust: Number,
      activity: Number,
      tags: [String]
    },
    chatRoomId: { type: Schema.Types.ObjectId, ref: "ChatRoom" },
    status: { type: String, enum: ["active", "completed"], default: "active" }
  },
  { timestamps: true }
);

matchSchema.index({ userIds: 1, status: 1, createdAt: -1 });
matchSchema.index({ game: 1, status: 1 });

export type MatchShape = InferSchemaType<typeof matchSchema>;
export type IMatch = HydratedDocument<MatchShape>;
export const Match = models.Match || model("Match", matchSchema);
