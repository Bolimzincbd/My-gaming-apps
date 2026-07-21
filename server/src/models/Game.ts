import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const gameSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    rankSystem: [{ type: String, required: true }],
    supportedModes: [{ type: String, required: true }]
  },
  { timestamps: true }
);

export type GameShape = InferSchemaType<typeof gameSchema>;
export type IGame = HydratedDocument<GameShape>;
export const Game = models.Game || model("Game", gameSchema);
