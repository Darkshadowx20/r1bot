import { BotContext } from "../types";
import { GroupSettings } from "../db/GroupSettings";

export async function wordFilterMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  if (!ctx.chat || ctx.chat.type === "private" || !ctx.message) {
    return next();
  }

  const chatId = ctx.chat.id;

  try {
    // Get group settings from database
    const groupSettings = await GroupSettings.findOne({ chatId });
    
    // If no blocked words are set, skip
    if (!groupSettings?.blockedWords || groupSettings.blockedWords.length === 0) {
      return next();
    }

    const messageText = ctx.message.text || "";
    const captionText = ctx.message.caption || "";
    const fullText = `${messageText} ${captionText}`.toLowerCase();

    // Check for blocked words
    const blockedWords = groupSettings.blockedWords.map(word => word.toLowerCase());
    const foundBlockedWords = blockedWords.filter(word => fullText.includes(word));

    if (foundBlockedWords.length > 0) {
      // Delete the message
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error("Could not delete message with blocked words:", error);
      }

      // Warn the user
      const userName = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name;
      await ctx.reply(`⚠️ ${userName}, your message contained inappropriate content and has been removed.`);
      return;
    }
  } catch (error) {
    console.error("Error in word filter middleware:", error);
  }

  return next();
} 