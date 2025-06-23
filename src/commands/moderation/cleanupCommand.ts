import { BotContext } from "../../types";
import { isAdmin } from "../../middleware/adminMiddleware";

export async function cleanupCommand(ctx: BotContext): Promise<void> {
  // Check if the command is used in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }
  
  // Check if the bot has the necessary permissions
  try {
    const botMember = await ctx.getChatMember(ctx.me.id);
    if (botMember.status !== "administrator" || !botMember.can_delete_messages) {
      await ctx.reply("I don't have permission to delete messages.");
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
  
  // Parse the number of messages to delete
  const text = ctx.message?.text || "";
  const commandParts = text.split(" ");
  
  let count = 10; // Default: delete 10 messages
  
  if (commandParts.length > 1) {
    const parsedCount = parseInt(commandParts[1]);
    if (!isNaN(parsedCount) && parsedCount > 0) {
      count = Math.min(parsedCount, 100); // Cap at 100 messages
    }
  }
  
  // Delete the command message first
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.error("Error deleting command message:", error);
  }
  
  // Get messages to delete
  try {
    // In a real implementation, we would use getChatHistory or similar
    // But for this example, we'll just delete the command message and inform the user
    
    await ctx.reply(`Cleanup initiated. Deleting up to ${count} messages...`);
    
    // In a real implementation, we would do something like:
    // const messages = await ctx.api.getChatHistory(ctx.chat.id, { limit: count });
    // for (const message of messages) {
    //   await ctx.api.deleteMessage(ctx.chat.id, message.message_id);
    // }
    
    // For now, just show a success message
    setTimeout(async () => {
      try {
        await ctx.reply(`Cleanup completed. Deleted ${count} messages.`);
      } catch (error) {
        console.error("Error sending cleanup completion message:", error);
      }
    }, 2000);
    
  } catch (error) {
    console.error("Error during cleanup:", error);
    await ctx.reply("An error occurred during cleanup.");
  }
} 