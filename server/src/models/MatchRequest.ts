import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";
import { MLBB_AVAILABILITY, MLBB_LANES, MLBB_PLAYSTYLES, MLBB_ROLES } from "../utils/mlbb";

const scoreBreakdownSchema = new Schema(
  {
    total: { type: Number, required: true },
    rank: { type: Number, required: true },
    role: { type: Number, required: true },
    lane: { type: Number, required: true },
    region: { type: Number, required: true },
    language: { type: Number, required: true },
    mode: { type: Number, required: true },
    playstyle: { type: Number, required: true },
    availability: { type: Number, required: true },
    trust: { type: Number, required: true },
    activity: { type: Number, required: true },
    tags: [{ type: String, default: [] }]
  },
  { _id: false }
);

const matchRequestSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetGame: { type: String, required: true },
    desiredRank: { type: String, required: true },
    desiredRankValue: { type: Number, required: true },
    region: { type: String, required: true },
    language: { type: String, required: true },
    mode: { type: String, required: true },
    playstyle: { type: String, required: true, enum: MLBB_PLAYSTYLES },
    mlbbRole: { type: String, required: true, enum: MLBB_ROLES },
    mlbbLane: { type: String, required: true, enum: MLBB_LANES },
    availability: { type: String, required: true, enum: MLBB_AVAILABILITY },
    scoreBreakdown: scoreBreakdownSchema,
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    }
  },
  { timestamps: true }
);

matchRequestSchema.index({ requesterId: 1, targetUserId: 1, targetGame: 1, status: 1 });
matchRequestSchema.index({ targetUserId: 1, status: 1, createdAt: -1 });

export type MatchRequestShape = InferSchemaType<typeof matchRequestSchema>;
export type IMatchRequest = HydratedDocument<MatchRequestShape>;
export const MatchRequest = models.MatchRequest || model("MatchRequest", matchRequestSchema);
