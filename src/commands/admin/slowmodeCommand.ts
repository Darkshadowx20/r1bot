import { BotContext } from "../../types";
import { isAdmin } from "../../middleware/adminMiddleware";
import { GroupSettings } from "../../db/GroupSettings";

export async function slowmodeCommand(ctx: BotContext): Promise<void> {
  // Check if the command is used in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }
  
  // Check if the bot has the necessary permissions
  try {
    const botMember = await ctx.getChatMember(ctx.me.id);
    if (botMember.status !== "administrator" || !botMember.can_restrict_members) {
      await ctx.reply("I don't have permission to set slowmode.");
      return;
    }
  } catch (error) {
    console.error("Error checking bot permissions:", error);
    await ctx.reply("Failed to check bot permissions.");
    return;
  }
  
  // Check if the user is an admin
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Could not identify user.");
    return;
  }
  
  const isUserAdmin = await isAdmin(ctx, userId);
  if (!isUserAdmin) {
    await ctx.reply("This command is only available to administrators.");
    return;
  }
  
  const text = ctx.message?.text || "";
  const commandParts = text.split(" ");
  
  if (commandParts.length < 2) {
    await ctx.reply("Usage: /slowmode <seconds> (0 to disable)");
    return;
  }

  const seconds = parseInt(commandParts[1]);
  if (isNaN(seconds) || seconds < 0) {
    await ctx.reply("Please provide a valid number of seconds (0 or positive).");
    return;
  }

  const chatId = ctx.chat.id;

  try {
    let groupSettings = await GroupSettings.findOne({ chatId });
    
    if (!groupSettings) {
      groupSettings = new GroupSettings({ chatId });
    }
    
    groupSettings.slowMode = seconds;
    await groupSettings.save();

    if (seconds === 0) {
      await ctx.reply("Slow mode has been disabled.");
    } else {
      await ctx.reply(`Slow mode has been set to ${seconds} seconds.`);
    }
  } catch (error) {
    console.error("Error setting slow mode:", error);
    await ctx.reply("Failed to set slow mode. Please try again.");
  }
}

// Helper function to format slowmode time
function formatSlowmodeTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else if (seconds < 60 * 60) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(seconds / (60 * 60));
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
} 