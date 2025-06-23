import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { isAdmin } from "../../middleware/adminMiddleware";
import { Warning } from "../../db/Warning";

export async function warnCommand(ctx: BotContext): Promise<void> {
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
  
  // Extract target user and reason
  const { targetUser, reason } = await extractUserAndReason(ctx);
  
  if (!targetUser) {
    await ctx.reply(
      "Please specify a user to warn by replying to their message, mentioning them, or providing their user ID."
    );
    return;
  }
  
  // Check if the target user is an admin
  const isTargetAdmin = await isAdmin(ctx, targetUser.id);
  if (isTargetAdmin) {
    await ctx.reply("I cannot warn an administrator.");
    return;
  }
  
  const chatId = ctx.chat.id;
  const targetId = targetUser.id;
  
  // Fetch or create warning doc
  let warning = await Warning.findOne({ userId: targetId, chatId });
  if (!warning) {
    warning = new Warning({ userId: targetId, chatId, count: 0, reasons: [], lastWarned: new Date() });
  }
  warning.count++;
  if (reason) warning.reasons.push(reason);
  warning.lastWarned = new Date();
  await warning.save();
  
  // Send warning message
  const warningMessage = `⚠️ User ${targetUser.username ? `@${targetUser.username}` : targetUser.first_name} has been warned`;
  await ctx.reply(`${warningMessage}${reason ? ` for: ${reason}` : "."}\nWarnings: ${warning.count}/3`);
  
  // Ban after 3 warnings
  if (warning.count >= 3) {
    try {
      await ctx.banChatMember(targetId);
      await ctx.reply(`User ${targetUser.username ? `@${targetUser.username}` : targetUser.first_name} has been banned for receiving 3 warnings.`);
      // Reset warnings in DB
      warning.count = 0;
      warning.reasons = [];
      await warning.save();
    } catch (error) {
      console.error("Error banning user after 3 warnings:", error);
      await ctx.reply("Failed to ban user after 3 warnings. Make sure I have the necessary permissions.");
    }
  }
  
  // Log the warning action
  console.log(`User ${targetId} warned in chat ${chatId} by ${userId}${reason ? ` for: ${reason}` : ""} (Warning ${warning.count}/3)`);
} 