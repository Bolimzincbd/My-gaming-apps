import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const messageSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type MessageShape = InferSchemaType<typeof messageSchema>;
export type IMessage = HydratedDocument<MessageShape>;
export const Message = models.Message || model("Message", messageSchema);
