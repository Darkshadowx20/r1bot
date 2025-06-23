import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWarning extends Document {
  userId: number;
  chatId: number;
  count: number;
  reasons: string[];
  lastWarned: Date;
}

const WarningSchema: Schema = new Schema<IWarning>({
  userId: { type: Number, required: true, index: true },
  chatId: { type: Number, required: true, index: true },
  count: { type: Number, default: 0 },
  reasons: { type: [String], default: [] },
  lastWarned: { type: Date, default: Date.now },
});

WarningSchema.index({ userId: 1, chatId: 1 }, { unique: true });

export const Warning: Model<IWarning> = mongoose.model<IWarning>("Warning", WarningSchema); 