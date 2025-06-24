import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReminder extends Document {
  reminderId: string;
  userId: number;
  chatId: number;
  message: string;
  createdAt: Date;
  reminderTime: Date;
  duration: number;
  isActive: boolean;
  username?: string;
  firstName?: string;
}

const ReminderSchema: Schema = new Schema<IReminder>({
  reminderId: { type: String, required: true, index: true },
  userId: { type: Number, required: true, index: true },
  chatId: { type: Number, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  reminderTime: { type: Date, required: true, index: true },
  duration: { type: Number, required: true },
  isActive: { type: Boolean, default: true, index: true },
  username: { type: String },
  firstName: { type: String }
});

// Create compound index for userId and reminderId
ReminderSchema.index({ userId: 1, reminderId: 1 }, { unique: true });

// Create index for finding expired reminders
ReminderSchema.index({ isActive: 1, reminderTime: 1 });

export const Reminder: Model<IReminder> = mongoose.model<IReminder>("Reminder", ReminderSchema); 