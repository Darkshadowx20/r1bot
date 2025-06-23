import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { Reputation } from "../../db/Reputation";

export async function repCommand(ctx: BotContext): Promise<void> {
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }

  const { targetUser } = await extractUserAndReason(ctx);
  const user = targetUser || ctx.from;
  if (!user) {
    await ctx.reply("Could not identify user.");
    return;
  }

  const chatId = ctx.chat.id;
  const userId = user.id;
  const giverId = ctx.from?.id;

  if (!giverId) {
    await ctx.reply("Could not identify who is giving reputation.");
    return;
  }

  // Users can't give reputation to themselves
  if (userId === giverId) {
    await ctx.reply("You cannot give reputation to yourself.");
    return;
  }

  try {
    let reputation = await Reputation.findOne({ userId, chatId });
    
    if (!reputation) {
      reputation = new Reputation({ userId, chatId, points: 0 });
    }

    // Check if the giver has already given reputation to this user recently
    // For simplicity, we'll allow one rep per user per day
    const lastUpdated = reputation.lastUpdated;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    if (lastUpdated > oneDayAgo) {
      await ctx.reply("You can only give reputation once per day to the same user.");
      return;
    }

    reputation.points += 1;
    reputation.lastUpdated = new Date();
    await reputation.save();

    const userName = user.username ? `@${user.username}` : user.first_name;
    await ctx.reply(`✅ Reputation given to ${userName}! They now have ${reputation.points} reputation points.`);
  } catch (error) {
    console.error("Error giving reputation:", error);
    await ctx.reply("Failed to give reputation. Please try again.");
  }
}

export async function getReputation(ctx: BotContext): Promise<void> {
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }

  const { targetUser } = await extractUserAndReason(ctx);
  const user = targetUser || ctx.from;
  if (!user) {
    await ctx.reply("Could not identify user.");
    return;
  }

  const chatId = ctx.chat.id;
  const userId = user.id;

  try {
    const reputation = await Reputation.findOne({ userId, chatId });
    const points = reputation ? reputation.points : 0;
    const userName = user.username ? `@${user.username}` : user.first_name;

    await ctx.reply(`${userName} has ${points} reputation points.`);
  } catch (error) {
    console.error("Error getting reputation:", error);
    await ctx.reply("Failed to get reputation. Please try again.");
  }
} 