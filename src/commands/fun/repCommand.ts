import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { Reputation } from "../../db/Reputation";

export async function repCommand(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.chat) {
      await ctx.reply("Could not identify chat.");
      return;
    }

    // Only allow in group chats
    if (ctx.chat.type === "private") {
      await ctx.reply("This command can only be used in groups.");
      return;
    }

    // Extract user and any additional text
    const { targetUser, reason } = await extractUserAndReason(ctx);
    
    if (!targetUser) {
      await ctx.reply(
        "Please specify a user to give reputation to by replying to their message or mentioning them.\n" +
        "Example: /rep @username\n" +
        "You can also specify points (1-5): /rep @username 3"
      );
      return;
    }

    const user = targetUser;
    const chatId = ctx.chat.id;
    const userId = user.id;
    const giverId = ctx.from?.id;

    if (!giverId) {
      await ctx.reply("Could not identify who is giving reputation.");
      return;
    }

    // Users can't give reputation to themselves
    if (userId === giverId) {
      await ctx.reply("❌ You cannot give reputation to yourself.");
      return;
    }

    // Don't allow giving reputation to bots
    if (user.is_bot) {
      await ctx.reply("❌ You cannot give reputation to bots.");
      return;
    }

    // Parse reputation points (default to 1 if not specified or invalid)
    let pointsToGive = 1;
    
    // Check if there's a number in the command text
    if (reason) {
      // Try to extract a number from the reason text
      const match = reason.match(/^(\d+)/);
      if (match) {
        const parsedPoints = parseInt(match[1]);
        // Limit points to 1-5 range
        if (parsedPoints >= 1 && parsedPoints <= 5) {
          pointsToGive = parsedPoints;
        } else if (parsedPoints > 5) {
          await ctx.reply("⚠️ You can only give 1-5 reputation points at once. Giving 5 points.");
          pointsToGive = 5;
        }
      }
    }

    try {
      let reputation = await Reputation.findOne({ userId, chatId });
      
      if (!reputation) {
        reputation = new Reputation({ 
          userId, 
          chatId, 
          points: 0,
          lastUpdated: new Date(0), // Set to epoch time to ensure first rep works
          givenBy: [],
          username: user.username ? user.username.toLowerCase() : undefined
        });
      }

      // Update the username if it exists
      if (user.username && (!reputation.username || reputation.username !== user.username.toLowerCase())) {
        reputation.username = user.username.toLowerCase();
      }

      // Initialize givenBy array if it doesn't exist
      if (!reputation.givenBy) {
        reputation.givenBy = [];
      }

      // Check if the giver has already given reputation to this user recently
      const lastGivenRecord = reputation.givenBy.find(record => record.giverId === giverId);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      if (lastGivenRecord && new Date(lastGivenRecord.timestamp) > oneDayAgo) {
        const timeLeft = new Date(lastGivenRecord.timestamp).getTime() + 24 * 60 * 60 * 1000 - Date.now();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        await ctx.reply(
          `⏳ You can give reputation to this user again in ${hoursLeft}h ${minutesLeft}m.`
        );
        return;
      }

      // Add or update the giver's record
      if (lastGivenRecord) {
        lastGivenRecord.timestamp = new Date();
      } else {
        reputation.givenBy.push({
          giverId,
          timestamp: new Date()
        });
      }

      // Increment reputation points
      reputation.points += pointsToGive;
      reputation.lastUpdated = new Date();
      await reputation.save();

      // Format the user name
      const userName = user.username ? `@${user.username}` : user.first_name;
      const giverName = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name || "Someone";
      
      // Create point emoji string based on points given
      const pointEmojis = "⭐".repeat(pointsToGive);
      
      // Send a nice formatted message
      await ctx.reply(
        `${pointEmojis} <b>${giverName}</b> gave ${pointsToGive} reputation point${pointsToGive !== 1 ? "s" : ""} to <b>${userName}</b>!\n\n` +
        `${userName} now has <b>${reputation.points}</b> reputation point${reputation.points !== 1 ? "s" : ""}.`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error("Error giving reputation:", error);
      await ctx.reply("❌ Failed to give reputation. Please try again.");
    }
  } catch (error) {
    console.error("Unexpected error in rep command:", error);
    await ctx.reply("❌ An unexpected error occurred. Please try again.");
  }
}

export async function getReputation(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.chat) {
      await ctx.reply("Could not identify chat.");
      return;
    }

    // Extract user
    const { targetUser } = await extractUserAndReason(ctx);

    const user = targetUser || ctx.from;
    if (!user) {
      await ctx.reply("Could not identify user.");
      return;
    }

    const chatId = ctx.chat.id;
    const userId = user.id;

    try {
      // Find reputation by user ID
      const reputation = await Reputation.findOne({ userId, chatId });
      
      const points = reputation ? reputation.points : 0;
      const userName = user.username ? `@${user.username}` : user.first_name;

      // Create reputation message with emoji based on points
      let reputationEmoji = "⭐";
      if (points >= 50) reputationEmoji = "🌟";
      else if (points >= 30) reputationEmoji = "💫";
      else if (points >= 20) reputationEmoji = "✨";
      else if (points >= 10) reputationEmoji = "🌠";
      
      await ctx.reply(
        `${reputationEmoji} <b>${userName}</b> has <b>${points}</b> reputation point${points !== 1 ? "s" : ""}!`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error("Error getting reputation:", error);
      await ctx.reply("❌ Failed to get reputation. Please try again.");
    }
  } catch (error) {
    console.error("Unexpected error in get reputation command:", error);
    await ctx.reply("❌ An unexpected error occurred. Please try again.");
  }
} 