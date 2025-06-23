import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { Report } from "../../db/Report";

export async function reportCommand(ctx: BotContext): Promise<void> {
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }

  const { targetUser, reason } = await extractUserAndReason(ctx);
  if (!targetUser) {
    await ctx.reply("Please specify a user to report by replying to their message or mentioning them.");
    return;
  }

  const reporterId = ctx.from?.id;
  if (!reporterId) {
    await ctx.reply("Could not identify who is making the report.");
    return;
  }

  // Users can't report themselves
  if (targetUser.id === reporterId) {
    await ctx.reply("You cannot report yourself.");
    return;
  }

  const chatId = ctx.chat.id;
  const reportedUserId = targetUser.id;
  const reportMessage = reason || "No reason provided";

  try {
    const report = new Report({
      chatId,
      reporterId,
      reportedUserId,
      message: reportMessage,
      timestamp: new Date(),
      status: "pending"
    });

    await report.save();

    const userName = targetUser.username ? `@${targetUser.username}` : targetUser.first_name;
    await ctx.reply(`✅ Report submitted for ${userName}. Admins will review it shortly.`);
  } catch (error) {
    console.error("Error submitting report:", error);
    await ctx.reply("Failed to submit report. Please try again.");
  }
}

export async function getReports(ctx: BotContext): Promise<void> {
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Could not identify user.");
    return;
  }

  // Check if user is admin
  try {
    const chatMember = await ctx.getChatMember(userId);
    const isAdmin = ["administrator", "creator"].includes(chatMember.status);
    
    if (!isAdmin) {
      await ctx.reply("This command is only available to administrators.");
      return;
    }
  } catch (error) {
    await ctx.reply("Failed to verify admin status.");
    return;
  }

  const chatId = ctx.chat.id;

  try {
    const reports = await Report.find({ chatId, status: "pending" }).sort({ timestamp: -1 }).limit(10);
    
    if (reports.length === 0) {
      await ctx.reply("No pending reports for this group.");
      return;
    }

    let reportText = "📋 **Pending Reports**\n\n";
    
    for (const report of reports) {
      const reporter = await ctx.api.getChatMember(chatId, report.reporterId);
      const reportedUser = await ctx.api.getChatMember(chatId, report.reportedUserId);
      
      const reporterName = reporter.user.username ? `@${reporter.user.username}` : reporter.user.first_name;
      const reportedName = reportedUser.user.username ? `@${reportedUser.user.username}` : reportedUser.user.first_name;
      
      reportText += `👤 **Reported:** ${reportedName}\n`;
      reportText += `📝 **By:** ${reporterName}\n`;
      reportText += `💬 **Reason:** ${report.message}\n`;
      reportText += `⏰ **Time:** ${report.timestamp.toLocaleString()}\n`;
      reportText += `🆔 **Report ID:** ${report._id}\n\n`;
    }

    await ctx.reply(reportText);
  } catch (error) {
    console.error("Error fetching reports:", error);
    await ctx.reply("Failed to fetch reports. Please try again.");
  }
} 