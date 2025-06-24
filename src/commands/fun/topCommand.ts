import { BotContext } from "../../types";
import { Reputation } from "../../db/Reputation";

export async function topCommand(ctx: BotContext): Promise<void> {
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

    const chatId = ctx.chat.id;
    
    try {
      // Find top 10 users by reputation points in this chat
      const topUsers = await Reputation.find({ chatId })
        .sort({ points: -1 })
        .limit(10);
      
      if (topUsers.length === 0) {
        await ctx.reply("No reputation data found for this group yet.");
        return;
      }

      // Build the leaderboard message
      let leaderboardText = "🏆 <b>Reputation Leaderboard</b> 🏆\n\n";
      
      // Add each user to the leaderboard
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        
        // Determine rank emoji
        let rankEmoji = "";
        if (i === 0) rankEmoji = "🥇";
        else if (i === 1) rankEmoji = "🥈";
        else if (i === 2) rankEmoji = "🥉";
        else rankEmoji = `${i + 1}.`;
        
        // Determine reputation emoji based on points
        let repEmoji = "⭐";
        if (user.points >= 50) repEmoji = "🌟";
        else if (user.points >= 30) repEmoji = "💫";
        else if (user.points >= 20) repEmoji = "✨";
        else if (user.points >= 10) repEmoji = "🌠";
        
        // Try to get user information for better display
        let userDisplay = "";
        try {
          if (user.username) {
            userDisplay = `@${user.username}`;
          } else {
            // If we only have userId but no username, try to create a mention
            userDisplay = `<a href="tg://user?id=${user.userId}">User</a>`;
          }
        } catch (error) {
          // Fallback if we can't get user info
          userDisplay = `User ${user.userId}`;
        }
        
        leaderboardText += `${rankEmoji} ${userDisplay}: ${repEmoji} <b>${user.points}</b> point${user.points !== 1 ? "s" : ""}\n`;
      }
      
      // Send the leaderboard
      await ctx.reply(leaderboardText, { parse_mode: "HTML" });
    } catch (error) {
      console.error("Error fetching reputation leaderboard:", error);
      await ctx.reply("❌ Failed to fetch reputation leaderboard. Please try again.");
    }
  } catch (error) {
    console.error("Unexpected error in top command:", error);
    await ctx.reply("❌ An unexpected error occurred. Please try again.");
  }
} 