import { BotContext } from "../../types";
import { GroupSettings } from "../../db/GroupSettings";

export async function rulesCommand(ctx: BotContext): Promise<void> {
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }

  const chatId = ctx.chat.id;

  try {
    const groupSettings = await GroupSettings.findOne({ chatId });
    
    if (!groupSettings || !groupSettings.rules) {
      await ctx.reply("No rules have been set for this group yet.");
      return;
    }

    await ctx.reply(`📋 **Group Rules**\n\n${groupSettings.rules}`);
  } catch (error) {
    console.error("Error fetching rules:", error);
    await ctx.reply("Failed to fetch group rules. Please try again.");
  }
} 