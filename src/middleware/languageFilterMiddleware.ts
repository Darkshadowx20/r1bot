import { BotContext } from "../types";
import { GroupSettings } from "../db/GroupSettings";

export async function languageFilterMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  if (!ctx.chat || ctx.chat.type === "private" || !ctx.message) {
    return next();
  }

  const chatId = ctx.chat.id;

  try {
    // Get group settings from database
    const groupSettings = await GroupSettings.findOne({ chatId });
    
    // If no blocked languages are set, skip
    if (!groupSettings?.blockedLanguages || groupSettings.blockedLanguages.length === 0) {
      return next();
    }

    const messageText = ctx.message.text || "";
    const captionText = ctx.message.caption || "";
    const fullText = `${messageText} ${captionText}`;

    if (!fullText.trim()) {
      return next();
    }

    // Check for blocked language scripts
    const blockedLanguages = groupSettings.blockedLanguages;
    const foundBlockedLanguage = blockedLanguages.some(lang => {
      switch (lang.toLowerCase()) {
        case "cyrillic":
          return /[\u0400-\u04FF]/.test(fullText); // Cyrillic script
        case "arabic":
          return /[\u0600-\u06FF]/.test(fullText); // Arabic script
        case "chinese":
          return /[\u4E00-\u9FFF]/.test(fullText); // Chinese characters
        case "japanese":
          return /[\u3040-\u309F\u30A0-\u30FF]/.test(fullText); // Hiragana and Katakana
        case "korean":
          return /[\uAC00-\uD7AF]/.test(fullText); // Korean Hangul
        default:
          return false;
      }
    });

    if (foundBlockedLanguage) {
      // Delete the message
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error("Could not delete message with blocked language:", error);
      }

      // Warn the user
      const userName = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name;
      await ctx.reply(`⚠️ ${userName}, messages in this language are not allowed in this group.`);
      return;
    }
  } catch (error) {
    console.error("Error in language filter middleware:", error);
  }

  return next();
} 