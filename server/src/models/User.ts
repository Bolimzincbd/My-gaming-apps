import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";
import { MLBB_AVAILABILITY, MLBB_LANES, MLBB_PLAYSTYLES, MLBB_ROLES } from "../utils/mlbb";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    preferredGames: [{ type: String, required: true }],
    preferredModes: [{ type: String, default: [] }],
    gameRanks: [
      {
        game: { type: String, required: true },
        rank: { type: String, required: true },
        rankValue: { type: Number, required: true }
      }
    ],
    region: { type: String, required: true },
    languages: [{ type: String, required: true }],
    playstyle: { type: String, required: true, enum: MLBB_PLAYSTYLES },
    mlbbRole: { type: String, enum: MLBB_ROLES, default: "Mage" },
    mlbbLane: { type: String, enum: MLBB_LANES, default: "Mid Lane" },
    availability: { type: String, enum: MLBB_AVAILABILITY, default: "Flexible" },
    trustScore: { type: Number, min: 0, max: 100, default: 70 },
    winRate: { type: Number, default: 50 },
    lastActive: { type: Date, default: Date.now },
    role: { type: String, enum: ["user", "seller", "admin"], default: "user" },
    sellerRating: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

userSchema.index({ preferredGames: 1, region: 1, mlbbLane: 1 });
userSchema.index({ "gameRanks.game": 1, "gameRanks.rankValue": 1 });
userSchema.index({ languages: 1 });
userSchema.index({ trustScore: -1, lastActive: -1 });

export type UserShape = InferSchemaType<typeof userSchema>;
export type IUser = HydratedDocument<UserShape>;
export const User = models.User || model("User", userSchema);
