import { BotContext } from "../../types";
import { AfkStatus } from "../../db/AfkStatus";

export async function backCommand(ctx: BotContext): Promise<void> {
  if (!ctx.chat || !ctx.from) {
    await ctx.reply("Could not identify chat or user.");
    return;
  }

  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  try {
    const afkStatus = await AfkStatus.findOne({ userId, chatId });
    
    if (!afkStatus || !afkStatus.isAfk) {
      await ctx.reply("You are not currently AFK.");
      return;
    }

    const afkSince = afkStatus.since;
    const duration = afkSince ? Math.floor((Date.now() - afkSince.getTime()) / 1000) : 0;
    
    afkStatus.isAfk = false;
    afkStatus.reason = undefined;
    afkStatus.since = undefined;
    await afkStatus.save();

    const userName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
    const durationText = duration > 0 ? ` (was away for ${Math.floor(duration / 60)}m ${duration % 60}s)` : "";
    await ctx.reply(`👋 Welcome back, ${userName}!${durationText}`);
  } catch (error) {
    console.error("Error removing AFK status:", error);
    await ctx.reply("Failed to remove AFK status. Please try again.");
  }
} 