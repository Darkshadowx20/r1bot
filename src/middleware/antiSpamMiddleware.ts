import { BotContext } from "../types";
import { GroupSettings } from "../db/GroupSettings";

// Store user message timestamps for flood detection
const userMessageTimestamps: Map<string, number[]> = new Map();

export async function antiSpamMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  if (!ctx.chat || ctx.chat.type === "private" || !ctx.from) {
    return next();
  }

  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const now = Date.now();

  try {
    // Get group settings from database
    const groupSettings = await GroupSettings.findOne({ chatId });
    
    // If anti-spam is not enabled, skip
    if (!groupSettings?.antiSpam) {
      return next();
    }

    const key = `${chatId}:${userId}`;
    const timestamps = userMessageTimestamps.get(key) || [];
    
    // Remove timestamps older than 10 seconds
    const recentTimestamps = timestamps.filter(time => now - time < 10000);
    
    // If user sent more than 5 messages in 10 seconds, consider it spam
    if (recentTimestamps.length >= 5) {
      // Delete the spam message
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error("Could not delete spam message:", error);
      }
      
      // Warn the user
      await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name}, please slow down your messages.`);
      
      // Clear their timestamp history
      userMessageTimestamps.delete(key);
      return;
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    userMessageTimestamps.set(key, recentTimestamps);
    
    // Clean up old entries to prevent memory leaks
    if (userMessageTimestamps.size > 1000) {
      const oldestKey = userMessageTimestamps.keys().next().value;
      if (oldestKey) {
        userMessageTimestamps.delete(oldestKey);
      }
    }
    
  } catch (error) {
    console.error("Error in anti-spam middleware:", error);
  }

  return next();
} 