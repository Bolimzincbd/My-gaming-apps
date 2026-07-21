import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";
import { MLBB_MARKET_CATEGORIES } from "../utils/mlbb";

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    game: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: MLBB_MARKET_CATEGORIES },
    listingType: { type: String, enum: ["service", "digital_product"], default: "service" },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String, default: [] }],
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["active", "paused", "sold", "flagged"],
      default: "active"
    },
    stock: { type: Number, min: 0, default: 1 },
    deliveryTimeHours: { type: Number, min: 1, max: 336, default: 24 },
    deliveryTimeLabel: { type: String, default: "24 hours" },
    escrowEligible: { type: Boolean, default: true },
    tags: [{ type: String, default: [] }]
  },
  { timestamps: true }
);

productSchema.index({ status: 1, game: 1, category: 1, price: 1 });
productSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
productSchema.index({ title: "text", description: "text", tags: "text" });

export type ProductShape = InferSchemaType<typeof productSchema>;
export type IProduct = HydratedDocument<ProductShape>;
export const Product = models.Product || model("Product", productSchema);
