import { NextFunction } from "grammy";
import { BotContext } from "../types";
import { GroupSettings } from "../db/GroupSettings";

// Regular expressions for detecting links
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
const TELEGRAM_INVITE_REGEX = /t\.me\/\+?[a-zA-Z0-9_-]+/gi;

export async function linkFilterMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  if (!ctx.chat || ctx.chat.type === "private" || !ctx.message) {
    return next();
  }

  const chatId = ctx.chat.id;

  try {
    // Get group settings from database
    const groupSettings = await GroupSettings.findOne({ chatId });
    
    // If link blocking is not enabled, skip
    if (!groupSettings?.blockLinks) {
      return next();
    }

    const messageText = ctx.message.text || "";
    const captionText = ctx.message.caption || "";
    const fullText = `${messageText} ${captionText}`.toLowerCase();

    // Check for URLs
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const hasUrls = urlPattern.test(fullText);

    if (hasUrls) {
      // Delete the message
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error("Could not delete message with links:", error);
      }

      // Warn the user
      const userName = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name;
      await ctx.reply(`⚠️ ${userName}, links are not allowed in this group.`);
      return;
    }
  } catch (error) {
    console.error("Error in link filter middleware:", error);
  }

  return next();
} 