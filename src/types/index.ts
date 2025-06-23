import { Context } from "grammy";
import { ConversationFlavor } from "@grammyjs/conversations";
import { HydrateFlavor } from "@grammyjs/hydrate";

// Warning count type
export interface WarningCount {
  [key: string]: number;
}

// Group settings type
export interface GroupSettings {
  [chatId: string]: {
    rules?: string;
    welcomeMessage?: string;
    goodbyeMessage?: string;
    antiSpam?: boolean;
    blockLinks?: boolean;
    blockInvites?: boolean;
    wordFilter?: boolean;
    bannedWords?: string[];
    blockedScripts?: string[];
  };
}

// AFK status type
export interface AfkStatus {
  isAfk: boolean;
  reason?: string;
  since?: Date;
}

// Reputation type
export interface Reputation {
  [key: string]: number;
}

// Reputation given type
export interface RepGiven {
  [key: string]: boolean;
}

// Report type
export interface Report {
  chatId: number;
  reporterId: number;
  reportedUserId: number;
  message: string;
  timestamp: Date;
  status: "pending" | "resolved" | "dismissed";
}

// User warning interface
export interface UserWarning {
  userId: number;
  chatId: number;
  count: number;
  reasons: string[];
  warnedBy: number[];
  lastWarned: Date;
}

// User role type
export type UserRole = "member" | "admin" | "moderator" | "trusted" | "restricted";

// User role interface
export interface UserRoleInfo {
  userId: number;
  chatId: number;
  role: UserRole;
  assignedBy: number;
  assignedAt: Date;
  expiresAt?: Date;
  reason?: string;
}

// Mute interface
export interface MuteInfo {
  userId: number;
  chatId: number;
  until: Date;
  reason?: string;
}

// User reputation interface
export interface UserReputation {
  userId: number;
  chatId: number;
  points: number;
  lastUpdated: Date;
}

// Reminder interface
export interface Reminder {
  userId: number;
  chatId: number;
  message: string;
  remindAt: Date;
  created: Date;
}

// Birthday interface
export interface Birthday {
  userId: number;
  date: Date; // Store as MM-DD
}

// Command interface
export interface Command {
  command: string;
  description: string;
  handler: (ctx: BotContext) => Promise<void>;
  adminOnly?: boolean;
}

// Auto-reply interface
export interface AutoReply {
  chatId: number;
  trigger: string;
  response: string;
}

// Scheduled action interface
export interface ScheduledAction {
  chatId: number;
  userId: number;
  action: "mute" | "unmute" | "kick" | "unban";
  executeAt: Date;
  reason?: string;
  duration?: number; // in milliseconds
}

// Custom command interface
export interface CustomCommand {
  chatId: number;
  command: string;
  response: string;
}

// Message stats interface
export interface MessageStats {
  chatId: number;
  userId: number;
  messageCount: number;
  lastActive: Date;
}

// Moderation action interface
export interface ModerationAction {
  chatId: number;
  userId: number;
  adminId: number;
  action: "ban" | "kick" | "mute" | "warn" | "unwarn";
  reason?: string;
  timestamp: Date;
}

// Bot context type
export type BotContext = ConversationFlavor<
  HydrateFlavor<Context>
>; 