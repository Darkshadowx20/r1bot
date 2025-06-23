import { BotContext } from "../../types";
import { isAdmin } from "../../middleware/adminMiddleware";

export async function unpinCommand(ctx: BotContext): Promise<void> {
  // Check if the command is used in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }
  
  // Check if the bot has the necessary permissions
  try {
    const botMember = await ctx.getChatMember(ctx.me.id);
    if (botMember.status !== "administrator" || !botMember.can_pin_messages) {
      await ctx.reply("I don't have permission to unpin messages.");
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
  
  // Check if "all" parameter is provided
  const text = ctx.message?.text || "";
  const commandParts = text.split(" ");
  const unpinAll = commandParts.some(part => part.toLowerCase() === "all");
  
  try {
    if (unpinAll) {
      // Unpin all messages
      await ctx.unpinAllChatMessages();
      await ctx.reply("All pinned messages have been unpinned.");
    } else {
      // Check if the command is a reply to a message
      if (ctx.message?.reply_to_message) {
        // Unpin specific message
        await ctx.unpinChatMessage(ctx.message.reply_to_message.message_id);
        await ctx.reply("Message unpinned.");
      } else {
        // Unpin the most recent pinned message
        await ctx.unpinChatMessage();
        await ctx.reply("Most recent pinned message has been unpinned.");
      }
    }
  } catch (error) {
    console.error("Error unpinning message:", error);
    await ctx.reply("Failed to unpin message.");
  }
} 