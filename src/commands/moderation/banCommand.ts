import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { isAdmin } from "../../middleware/adminMiddleware";

export async function banCommand(ctx: BotContext): Promise<void> {
  // Check if the command is used in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }
  
  // Check if the bot has the necessary permissions
  try {
    const botMember = await ctx.getChatMember(ctx.me.id);
    if (botMember.status !== "administrator" || !botMember.can_restrict_members) {
      await ctx.reply("I don't have permission to ban members.");
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
  
  // Extract target user and reason
  const { targetUser, reason } = await extractUserAndReason(ctx);
  
  if (!targetUser) {
    await ctx.reply(
      "Please specify a user to ban by replying to their message, mentioning them, or providing their user ID."
    );
    return;
  }
  
  // Check if the target user is an admin
  const isTargetAdmin = await isAdmin(ctx, targetUser.id);
  if (isTargetAdmin) {
    await ctx.reply("I cannot ban an administrator.");
    return;
  }
  
  // Ban the user
  try {
    await ctx.banChatMember(targetUser.id);
    
    // Send confirmation message
    const banMessage = `User ${targetUser.username ? `@${targetUser.username}` : targetUser.first_name} has been banned`;
    await ctx.reply(`${banMessage}${reason ? ` for: ${reason}` : "."}`);
    
    // Log the ban action
    console.log(`User ${targetUser.id} banned from chat ${ctx.chat.id} by ${userId}${reason ? ` for: ${reason}` : ""}`);
    
  } catch (error) {
    console.error("Error banning user:", error);
    await ctx.reply("Failed to ban user. Make sure I have the necessary permissions.");
  }
} 