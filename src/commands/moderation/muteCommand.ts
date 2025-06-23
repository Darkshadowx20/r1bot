import { BotContext } from "../../types";
import { extractUserAndReason, parseDuration, formatDuration } from "../../utils/commandUtils";
import { isAdmin } from "../../middleware/adminMiddleware";

export async function muteCommand(ctx: BotContext): Promise<void> {
  // Check if the command is used in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }
  
  // Check if the bot has the necessary permissions
  try {
    const botMember = await ctx.getChatMember(ctx.me.id);
    if (botMember.status !== "administrator" || !botMember.can_restrict_members) {
      await ctx.reply("I don't have permission to restrict members.");
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
  
  // Extract target user and reason/duration
  const { targetUser, reason: fullReason } = await extractUserAndReason(ctx);
  
  if (!targetUser) {
    await ctx.reply(
      "Please specify a user to mute by replying to their message, mentioning them, or providing their user ID."
    );
    return;
  }
  
  // Check if the target user is an admin
  const isTargetAdmin = await isAdmin(ctx, targetUser.id);
  if (isTargetAdmin) {
    await ctx.reply("I cannot mute an administrator.");
    return;
  }
  
  // Parse duration and reason
  let duration = 24 * 60 * 60; // Default: 24 hours in seconds
  let reason: string | undefined;
  
  if (fullReason) {
    const parts = fullReason.split(" ");
    const possibleDuration = parseDuration(parts[0]);
    
    if (possibleDuration !== null) {
      duration = Math.floor(possibleDuration / 1000); // Convert ms to seconds
      reason = parts.slice(1).join(" ");
    } else {
      reason = fullReason;
    }
  }
  
  // Mute the user
  try {
    const untilDate = Math.floor(Date.now() / 1000) + duration;
    
    await ctx.restrictChatMember(targetUser.id, {
      can_send_messages: false,
      can_send_polls: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
      can_invite_users: true
    }, { until_date: untilDate });
    
    // Send confirmation message
    const muteMessage = `User ${targetUser.username ? `@${targetUser.username}` : targetUser.first_name} has been muted for ${formatDuration(duration * 1000)}`;
    await ctx.reply(`${muteMessage}${reason ? ` for: ${reason}` : "."}`);
    
    // Log the mute action
    console.log(`User ${targetUser.id} muted in chat ${ctx.chat.id} by ${userId} for ${duration} seconds${reason ? ` for: ${reason}` : ""}`);
    
    // Store mute information in database (in a real implementation)
    
  } catch (error) {
    console.error("Error muting user:", error);
    await ctx.reply("Failed to mute user. Make sure I have the necessary permissions.");
  }
} 