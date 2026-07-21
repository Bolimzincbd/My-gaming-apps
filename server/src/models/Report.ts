import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["user", "listing"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending" }
  },
  { timestamps: true }
);

export type ReportShape = InferSchemaType<typeof reportSchema>;
export type IReport = HydratedDocument<ReportShape>;
export const Report = models.Report || model("Report", reportSchema);
