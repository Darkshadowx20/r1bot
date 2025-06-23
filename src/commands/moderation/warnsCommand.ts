import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { Warning } from "../../db/Warning";

export async function warnsCommand(ctx: BotContext): Promise<void> {
  // Works in both groups and private chats
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }
  
  // Extract target user
  const { targetUser } = await extractUserAndReason(ctx);
  
  // If no target user specified, use the command sender
  const user = targetUser || ctx.from;
  
  if (!user) {
    await ctx.reply("Could not identify user.");
    return;
  }
  
  const chatId = ctx.chat.id;
  const userId = user.id;
  const warning = await Warning.findOne({ userId, chatId });
  const warningCount = warning ? warning.count : 0;
  
  // Send warning information
  const userName = user.username ? `@${user.username}` : user.first_name;
  
  if (warningCount === 0) {
    await ctx.reply(`${userName} has no warnings.`);
  } else {
    await ctx.reply(`${userName} has ${warningCount} warning${warningCount !== 1 ? 's' : ''} (${warningCount}/3).`);
  }
} 