import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { isAdmin } from "../../middleware/adminMiddleware";

export async function unmuteCommand(ctx: BotContext): Promise<void> {
  // Check if the command is used in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }
  
  // Check if the bot has the necessary permissions
  try {
    const botMember = await ctx.getChatMember(ctx.me.id);
    if (botMember.status !== "administrator" || !botMember.can_restrict_members) {
      await ctx.reply("I don't have permission to unmute members.");
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
  
  // Extract target user
  const { targetUser } = await extractUserAndReason(ctx);
  
  if (!targetUser) {
    await ctx.reply(
      "Please specify a user to unmute by replying to their message, mentioning them, or providing their user ID."
    );
    return;
  }
  
  // Check if the target user is an admin
  const isTargetAdmin = await isAdmin(ctx, targetUser.id);
  if (isTargetAdmin) {
    await ctx.reply("I cannot unmute an administrator.");
    return;
  }
  
  // Unmute the user
  try {
    await ctx.restrictChatMember(targetUser.id, {
      can_send_messages: true,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
      can_invite_users: true
    });
    
    // Send confirmation message
    await ctx.reply(
      `User ${targetUser.username ? `@${targetUser.username}` : targetUser.first_name} has been unmuted.`
    );
    
    // Log the unmute action
    console.log(`User ${targetUser.id} unmuted in chat ${ctx.chat.id} by ${userId}`);
    
    // Remove mute information from database (in a real implementation)
    
  } catch (error) {
    console.error("Error unmuting user:", error);
    await ctx.reply("Failed to unmute user. Make sure I have the necessary permissions.");
  }
} 