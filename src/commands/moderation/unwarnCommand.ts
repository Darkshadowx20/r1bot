import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { isAdmin } from "../../middleware/adminMiddleware";
import { Warning } from "../../db/Warning";

export async function unwarnCommand(ctx: BotContext): Promise<void> {
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
  const { targetUser } = await extractUserAndReason(ctx);
  
  if (!targetUser) {
    await ctx.reply(
      "Please specify a user to remove warnings from by replying to their message, mentioning them, or providing their user ID."
    );
    return;
  }
  
  const chatId = ctx.chat.id;
  const targetId = targetUser.id;
  const warning = await Warning.findOne({ userId: targetId, chatId });
  
  if (!warning || warning.count === 0) {
    await ctx.reply(`User ${targetUser.username ? `@${targetUser.username}` : targetUser.first_name} has no warnings to remove.`);
    return;
  }
  
  // Check if "all" parameter is provided
  const text = ctx.message?.text || "";
  const commandParts = text.split(" ");
  const removeAll = commandParts.some(part => part.toLowerCase() === "all");
  
  if (removeAll) {
    warning.count = 0;
    warning.reasons = [];
    await warning.save();
    await ctx.reply(`All warnings have been removed for user ${targetUser.username ? `@${targetUser.username}` : targetUser.first_name}.`);
  } else {
    warning.count = Math.max(0, warning.count - 1);
    if (warning.reasons.length > 0) warning.reasons.pop();
    await warning.save();
    await ctx.reply(
      `One warning has been removed for user ${targetUser.username ? `@${targetUser.username}` : targetUser.first_name}.\nWarnings: ${warning.count}/3`
    );
  }
  
  // Log the unwarn action
  console.log(`Warnings ${removeAll ? "all" : "one"} removed for user ${targetId} in chat ${chatId} by ${userId}`);
} 