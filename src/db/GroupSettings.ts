import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroupSettings extends Document {
  chatId: number;
  welcomeMessage?: string;
  goodbyeMessage?: string;
  rules?: string;
  slowMode?: number;
  antiSpam: boolean;
  blockLinks: boolean;
  blockInvites: boolean;
  blockedMedia: string[];
  blockedWords: string[];
  blockedLanguages: string[];
  requireVerification: boolean;
  logChannel?: number;
}

const GroupSettingsSchema: Schema = new Schema<IGroupSettings>({
  chatId: { type: Number, required: true, unique: true, index: true },
  welcomeMessage: { type: String },
  goodbyeMessage: { type: String },
  rules: { type: String },
  slowMode: { type: Number },
  antiSpam: { type: Boolean, default: false },
  blockLinks: { type: Boolean, default: false },
  blockInvites: { type: Boolean, default: false },
  blockedMedia: { type: [String], default: [] },
  blockedWords: { type: [String], default: [] },
  blockedLanguages: { type: [String], default: [] },
  requireVerification: { type: Boolean, default: false },
  logChannel: { type: Number },
});

export const GroupSettings: Model<IGroupSettings> = mongoose.model<IGroupSettings>("GroupSettings", GroupSettingsSchema); 