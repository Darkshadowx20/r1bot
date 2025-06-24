import mongoose, { Schema, Document, Model } from "mongoose";

interface ReputationGiver {
  giverId: number;
  timestamp: Date;
}

export interface IReputation extends Document {
  userId: number;
  chatId: number;
  points: number;
  lastUpdated: Date;
  givenBy: ReputationGiver[];
  username?: string;
}

const ReputationSchema: Schema = new Schema<IReputation>({
  userId: { type: Number, required: true, index: true },
  chatId: { type: Number, required: true, index: true },
  points: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  givenBy: [{ 
    giverId: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  username: { type: String, sparse: true }
});

ReputationSchema.index({ userId: 1, chatId: 1 }, { unique: true });

ReputationSchema.index({ chatId: 1, username: 1 }, { sparse: true });

export const Reputation: Model<IReputation> = mongoose.model<IReputation>("Reputation", ReputationSchema); 