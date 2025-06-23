import { BotContext } from "../../types";
import { isAdmin } from "../../middleware/adminMiddleware";
import { GroupSettings } from "../../db/GroupSettings";

export async function setrulesCommand(ctx: BotContext): Promise<void> {
  // Check if the command is used in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
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
  
  // Get the rules text
  const text = ctx.message?.text || "";
  const commandParts = text.split(" ");
  
  if (commandParts.length < 2) {
    await ctx.reply("Usage: /setrules <rules text>");
    return;
  }
  
  const rulesText = commandParts.slice(1).join(" ");
  const chatId = ctx.chat.id;
  
  try {
    let groupSettings = await GroupSettings.findOne({ chatId });
    
    if (!groupSettings) {
      groupSettings = new GroupSettings({ chatId });
    }
    
    groupSettings.rules = rulesText;
    await groupSettings.save();

    await ctx.reply("Group rules have been updated successfully!");
  } catch (error) {
    console.error("Error setting rules:", error);
    await ctx.reply("Failed to set group rules. Please try again.");
  }
} 