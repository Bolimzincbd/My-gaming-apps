import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type NotificationShape = InferSchemaType<typeof notificationSchema>;
export type INotification = HydratedDocument<NotificationShape>;
export const Notification = models.Notification || model("Notification", notificationSchema);
