import { BotContext } from "../../types";

export async function startCommand(ctx: BotContext): Promise<void> {
  const userName = ctx.from?.first_name || "there";
  
  // Different message for private chats vs. groups
  if (ctx.chat?.type === "private") {
    await ctx.reply(
      `👋 Hello, ${userName}!\n\n` +
      `I'm a group management bot designed to help keep your Telegram groups safe and organized.\n\n` +
      `Add me to a group and make me admin to use my moderation features.\n\n` +
      `Type /help to see available commands.`
    );
  } else {
    await ctx.reply(
      `👋 Hello, ${userName}!\n\n` +
      `I'm ready to help manage this group. Make sure I have the necessary admin permissions.\n\n` +
      `Type /help to see available commands.`
    );
  }
} 