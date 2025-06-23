import { BotContext } from "../../types";
import { isAdmin } from "../../middleware/adminMiddleware";
import { GroupSettings } from "../../db/GroupSettings";

export async function goodbyeCommand(ctx: BotContext): Promise<void> {
  // Check if the command is used in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }
  
  const chatId = ctx.chat.id;
  
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
  
  // Get the goodbye message text
  const text = ctx.message?.text || "";
  const commandParts = text.split(/\s+/);
  
  // Remove the command itself
  commandParts.shift();
  
  // Join the rest as the goodbye message text
  const goodbyeMessage = commandParts.join(" ");
  
  // If no goodbye message is provided, show the current one or instructions
  if (!goodbyeMessage) {
    // Fetch from DB
    const settings = await GroupSettings.findOne({ chatId });
    const currentGoodbye = settings?.goodbyeMessage;
    
    if (currentGoodbye) {
      await ctx.reply(
        "Current goodbye message:\n\n" +
        currentGoodbye + "\n\n" +
        "To change it, use /goodbye followed by your new goodbye message."
      );
    } else {
      await ctx.reply(
        "No goodbye message is set. To set one, use /goodbye followed by your goodbye message.\n\n" +
        "Example: /goodbye Goodbye, {user}! We'll miss you."
      );
    }
    return;
  }
  
  // Update in DB
  let settings = await GroupSettings.findOne({ chatId });
  if (!settings) {
    settings = new GroupSettings({ chatId });
  }
  settings.goodbyeMessage = goodbyeMessage;
  await settings.save();
  
  await ctx.reply(
    "Goodbye message has been set. A message will be sent when members leave the group.\n\n" +
    "You can use the following placeholders:\n" +
    "{user} - User's name\n" +
    "{group} - Group name"
  );
  
  // Log the action
  console.log(`Goodbye message updated for chat ${ctx.chat.id} by user ${userId}`);
} 