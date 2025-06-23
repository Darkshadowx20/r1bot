import { NextFunction } from "grammy";
import { BotContext } from "../types";
import { AfkStatus } from "../db/AfkStatus";

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else {
    return `${diffSecs} second${diffSecs !== 1 ? "s" : ""} ago`;
  }
}

export async function afkMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  if (!ctx.message || !ctx.from || !ctx.chat) {
    return next();
  }

  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  // If user is AFK and sends any message other than /afk, remove AFK status
  if (ctx.message.text && !ctx.message.text.toLowerCase().startsWith("/afk")) {
    const afkStatus = await AfkStatus.findOne({ userId, chatId });
    if (afkStatus && afkStatus.isAfk) {
      afkStatus.isAfk = false;
      afkStatus.reason = undefined;
      afkStatus.since = undefined;
      await afkStatus.save();
      await ctx.reply(`Welcome back, ${ctx.from.first_name}!`);
    }
  }

  // Check if message mentions any AFK users
  if (ctx.message.entities && ctx.message.text) {
    const mentions = ctx.message.entities.filter(entity => entity.type === "mention" || entity.type === "text_mention");
    for (const mention of mentions) {
      let mentionedUserId: number | undefined;
      if (mention.type === "text_mention" && mention.user) {
        mentionedUserId = mention.user.id;
      } else if (mention.type === "mention") {
        // Extract username from mention
        const username = ctx.message.text.substring(mention.offset + 1, mention.offset + mention.length);
        // In a real implementation, you would look up the user ID from the username in your database
        // This is just a placeholder
        continue;
      }
      if (mentionedUserId) {
        const mentionedAfk = await AfkStatus.findOne({ userId: mentionedUserId, chatId });
        if (mentionedAfk && mentionedAfk.isAfk && mentionedAfk.since) {
          const timeAgo = getTimeAgo(mentionedAfk.since);
          await ctx.reply(
            `This user is currently AFK${mentionedAfk.reason ? ` (${mentionedAfk.reason})` : ""} - ${timeAgo}`
          );
        }
      }
    }
  }

  return next();
} 