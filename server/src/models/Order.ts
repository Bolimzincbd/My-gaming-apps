import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";
import { ESCROW_STATUSES } from "../utils/mlbb";

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: [...ESCROW_STATUSES], required: true },
    actorRole: { type: String, enum: ["buyer", "seller", "admin", "system"], required: true },
    byUserId: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true },
        game: { type: String, required: true },
        category: { type: String, default: "" },
        deliveryTimeHours: { type: Number, default: 24 },
        deliveryTimeLabel: { type: String, default: "24 hours" },
        escrowEligible: { type: Boolean, default: true }
      }
    ],
    total: { type: Number, required: true },
    paymentMethodMock: { type: String, default: "Mock secure wallet" },
    paymentStatusMock: {
      type: String,
      enum: ["pending", "secured", "released", "refunded", "cancelled"],
      default: "secured"
    },
    fulfillmentStatus: {
      type: String,
      enum: ["processing", "delivering", "delivered", "completed", "disputed", "refunded", "cancelled"],
      default: "processing"
    },
    escrowStatus: { type: String, enum: [...ESCROW_STATUSES], default: "escrow_secured" },
    statusHistory: { type: [statusHistorySchema], default: [] },
    disputeReason: { type: String, default: "" },
    resolutionNote: { type: String, default: "" }
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ "items.sellerId": 1, escrowStatus: 1, createdAt: -1 });
orderSchema.index({ escrowStatus: 1, createdAt: -1 });

export type OrderShape = InferSchemaType<typeof orderSchema>;
export type IOrder = HydratedDocument<OrderShape>;
export const Order = models.Order || model("Order", orderSchema);
