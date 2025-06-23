import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReputation extends Document {
  userId: number;
  chatId: number;
  points: number;
  lastUpdated: Date;
}

const ReputationSchema: Schema = new Schema<IReputation>({
  userId: { type: Number, required: true, index: true },
  chatId: { type: Number, required: true, index: true },
  points: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

ReputationSchema.index({ userId: 1, chatId: 1 }, { unique: true });

export const Reputation: Model<IReputation> = mongoose.model<IReputation>("Reputation", ReputationSchema); 