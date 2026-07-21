import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        title: { type: String, required: true },
        game: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true }
      }
    ],
    subtotal: { type: Number, default: 0 }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export type CartShape = InferSchemaType<typeof cartSchema>;
export type ICart = HydratedDocument<CartShape>;
export const Cart = models.Cart || model("Cart", cartSchema);
