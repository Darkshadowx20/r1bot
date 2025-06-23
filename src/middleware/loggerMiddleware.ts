import { NextFunction } from "grammy";
import { BotContext } from "../types";

export async function loggerMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  // Process the update first
  await next();
  
  // Skip for non-message updates
  if (!ctx.message) {
    return;
  }
  
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  
  if (!userId || !chatId) {
    return;
  }
  
  // Get log channel ID from environment variables or group settings
  const logChannelId = process.env.LOG_CHANNEL_ID ? 
    Number(process.env.LOG_CHANNEL_ID) : undefined;
  
  // Skip if no log channel is configured
  if (!logChannelId) {
    return;
  }
  
  try {
    // Log different types of events
    if (ctx.message.new_chat_members) {
      // New members joined
      const newMembers = ctx.message.new_chat_members;
      const memberNames = newMembers.map(member => 
        member.username ? `@${member.username}` : member.first_name
      ).join(", ");
      
      await ctx.api.sendMessage(
        logChannelId,
        `👋 <b>New members joined:</b> ${memberNames}\n` +
        `<b>Chat:</b> ${ctx.chat.title || chatId}\n` +
        `<b>Time:</b> ${new Date().toISOString()}`
      );
    } else if (ctx.message.left_chat_member) {
      // Member left
      const leftMember = ctx.message.left_chat_member;
      const memberName = leftMember.username ? 
        `@${leftMember.username}` : leftMember.first_name;
      
      await ctx.api.sendMessage(
        logChannelId,
        `🚶 <b>Member left:</b> ${memberName}\n` +
        `<b>Chat:</b> ${ctx.chat.title || chatId}\n` +
        `<b>Time:</b> ${new Date().toISOString()}`
      );
    } else if (ctx.message.text?.startsWith("/")) {
      // Command executed
      await ctx.api.sendMessage(
        logChannelId,
        `🤖 <b>Command executed:</b> ${ctx.message.text}\n` +
        `<b>User:</b> ${ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name} (${userId})\n` +
        `<b>Chat:</b> ${ctx.chat.title || chatId}\n` +
        `<b>Time:</b> ${new Date().toISOString()}`
      );
    }
    
    // Additional logging for moderation actions could be added here
    
  } catch (error) {
    console.error("Error sending log message:", error);
  }
} 