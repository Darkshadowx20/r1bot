import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAfkStatus extends Document {
  userId: number;
  chatId: number;
  isAfk: boolean;
  reason?: string;
  since?: Date;
}

const AfkStatusSchema: Schema = new Schema<IAfkStatus>({
  userId: { type: Number, required: true, index: true },
  chatId: { type: Number, required: true, index: true },
  isAfk: { type: Boolean, default: false },
  reason: { type: String },
  since: { type: Date },
});

AfkStatusSchema.index({ userId: 1, chatId: 1 }, { unique: true });

export const AfkStatus: Model<IAfkStatus> = mongoose.model<IAfkStatus>("AfkStatus", AfkStatusSchema); 