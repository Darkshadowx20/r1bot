import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReport extends Document {
  chatId: number;
  reporterId: number;
  reportedUserId: number;
  message: string;
  timestamp: Date;
  status: "pending" | "resolved" | "dismissed";
  reportedMessageId?: number;
  reportedMessageLink?: string;
}

const ReportSchema: Schema = new Schema<IReport>({
  chatId: { type: Number, required: true, index: true },
  reporterId: { type: Number, required: true },
  reportedUserId: { type: Number, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "resolved", "dismissed"], default: "pending" },
  reportedMessageId: { type: Number },
  reportedMessageLink: { type: String },
});

export const Report: Model<IReport> = mongoose.model<IReport>("Report", ReportSchema); 