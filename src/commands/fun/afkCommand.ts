import { BotContext } from "../../types";
import { AfkStatus } from "../../db/AfkStatus";

export async function afkCommand(ctx: BotContext): Promise<void> {
  if (!ctx.chat || !ctx.from) {
    await ctx.reply("Could not identify chat or user.");
    return;
  }

  const userId = ctx.from.id;
  const chatId = ctx.chat.id;
  const text = ctx.message?.text || "";
  const commandParts = text.split(" ");
  
  // Extract reason from command
  const reason = commandParts.slice(1).join(" ") || "No reason provided";

  try {
    let afkStatus = await AfkStatus.findOne({ userId, chatId });
    
    if (!afkStatus) {
      afkStatus = new AfkStatus({ userId, chatId });
    }
    
    afkStatus.isAfk = true;
    afkStatus.reason = reason;
    afkStatus.since = new Date();
    await afkStatus.save();

    const userName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
    await ctx.reply(`👋 ${userName} is now AFK: ${reason}`);
  } catch (error) {
    console.error("Error setting AFK status:", error);
    await ctx.reply("Failed to set AFK status. Please try again.");
  }
} 