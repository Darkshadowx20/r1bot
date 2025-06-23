import { BotContext } from "../../types";
import { isAdmin } from "../../middleware/adminMiddleware";
import { GroupSettings } from "../../db/GroupSettings";

export async function welcomeCommand(ctx: BotContext): Promise<void> {
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
  
  // Get the welcome message text
  const text = ctx.message?.text || "";
  const commandParts = text.split(/\s+/);
  
  // Remove the command itself
  commandParts.shift();
  
  // Join the rest as the welcome message text
  const welcomeMessage = commandParts.join(" ");
  
  // If no welcome message is provided, show the current one or instructions
  if (!welcomeMessage) {
    // Fetch from DB
    const chatId = ctx.chat.id;
    const settings = await GroupSettings.findOne({ chatId });
    const currentWelcome = settings?.welcomeMessage;
    
    if (currentWelcome) {
      await ctx.reply(
        "Current welcome message:\n\n" +
        currentWelcome + "\n\n" +
        "To change it, use /welcome followed by your new welcome message."
      );
    } else {
      await ctx.reply(
        "No welcome message is set. To set one, use /welcome followed by your welcome message.\n\n" +
        "Example: /welcome Welcome to our group, {user}! Please read the rules."
      );
    }
    return;
  }
  
  // Update in DB
  const chatId = ctx.chat.id;
  let settings = await GroupSettings.findOne({ chatId });
  if (!settings) {
    settings = new GroupSettings({ chatId });
  }
  settings.welcomeMessage = welcomeMessage;
  await settings.save();
  
  await ctx.reply(
    "Welcome message has been set. New members will now receive this message when they join.\n\n" +
    "You can use the following placeholders:\n" +
    "{user} - User's name\n" +
    "{group} - Group name"
  );
  
  // Log the action
  console.log(`Welcome message updated for chat ${chatId} by user ${userId}`);
} 