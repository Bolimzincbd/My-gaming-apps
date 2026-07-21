import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const reviewSchema = new Schema(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true }
  },
  { timestamps: true }
);

export type ReviewShape = InferSchemaType<typeof reviewSchema>;
export type IReview = HydratedDocument<ReviewShape>;
export const Review = models.Review || model("Review", reviewSchema);
