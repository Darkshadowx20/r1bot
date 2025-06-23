import { BotContext } from "../../types";
import { isAdmin } from "../../middleware/adminMiddleware";

export async function pinCommand(ctx: BotContext): Promise<void> {
  // Check if the command is used in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }
  
  // Check if the bot has the necessary permissions
  try {
    const botMember = await ctx.getChatMember(ctx.me.id);
    if (botMember.status !== "administrator" || !botMember.can_pin_messages) {
      await ctx.reply("I don't have permission to pin messages.");
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
  
  // Check if the command is a reply to a message
  if (!ctx.message?.reply_to_message) {
    await ctx.reply("Please reply to a message that you want to pin.");
    return;
  }
  
  // Check if the "silent" parameter is provided
  const text = ctx.message.text || "";
  const commandParts = text.split(" ");
  const silent = commandParts.some(part => part.toLowerCase() === "silent");
  
  // Pin the message
  try {
    await ctx.pinChatMessage(ctx.message.reply_to_message.message_id, {
      disable_notification: silent
    });
    
    await ctx.reply(`Message pinned${silent ? " silently" : ""}.`);
  } catch (error) {
    console.error("Error pinning message:", error);
    await ctx.reply("Failed to pin message.");
  }
} 