import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { Report } from "../../db/Report";
import { GroupSettings } from "../../db/GroupSettings";

export async function reportCommand(ctx: BotContext): Promise<void> {
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }

  // Check if it's a group chat
  if (ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in group chats.");
    return;
  }

  // First try to extract user from reply or mention
  const { targetUser, reason } = await extractUserAndReason(ctx);
  
  let finalTargetUser = targetUser;
  let finalReason = reason;
  
  // If no target user was found but we have message entities (mentions)
  if (!finalTargetUser && ctx.message?.entities && ctx.message.text) {
    // Find mention entities
    const mentionEntities = ctx.message.entities.filter(
      entity => entity.type === "mention" || entity.type === "text_mention"
    );
    
    if (mentionEntities.length > 0) {
      const entity = mentionEntities[0]; // Use the first mention
      
      if (entity.type === "text_mention" && entity.user) {
        // Direct mention with user object
        finalTargetUser = entity.user;
        // Extract reason (everything after the mention)
        const mentionEnd = entity.offset + entity.length;
        finalReason = ctx.message.text.slice(mentionEnd).trim();
      } else if (entity.type === "mention") {
        // @username mention
        const username = ctx.message.text.substring(entity.offset + 1, entity.offset + entity.length);
        
        try {
          // Try to find user among admins first (since we can easily get them)
          const chatAdmins = await ctx.getChatAdministrators();
          const adminMatch = chatAdmins.find(
            admin => admin.user.username && admin.user.username.toLowerCase() === username.toLowerCase()
          );
          
          if (adminMatch) {
            finalTargetUser = adminMatch.user;
          }
          
          // Extract reason (everything after the mention)
          const mentionEnd = entity.offset + entity.length;
          finalReason = ctx.message.text.slice(mentionEnd).trim();
        } catch (error) {
          console.error("Error finding user by username:", error);
        }
      }
    }
  }
  
  // If we still don't have a target user, check for plain text username
  if (!finalTargetUser && ctx.message?.text) {
    const text = ctx.message.text;
    const parts = text.split(' ');
    
    // If there's text after the command and it starts with @
    if (parts.length > 1 && parts[1].startsWith('@')) {
      const username = parts[1].substring(1); // Remove @ symbol
      
      try {
        // Try to find the user among admins
        const chatAdmins = await ctx.getChatAdministrators();
        const adminMatch = chatAdmins.find(
          admin => admin.user.username && admin.user.username.toLowerCase() === username.toLowerCase()
        );
        
        if (adminMatch) {
          finalTargetUser = adminMatch.user;
          // Remove the username from the reason
          finalReason = parts.slice(2).join(' ');
        }
      } catch (error) {
        console.error("Error finding user by username:", error);
      }
    }
  }
  
  if (!finalTargetUser) {
    await ctx.reply("Please specify a user to report by replying to their message or mentioning them with @username.");
    return;
  }

  const reporterId = ctx.from?.id;
  if (!reporterId) {
    await ctx.reply("Could not identify who is making the report.");
    return;
  }

  // Users can't report themselves
  if (finalTargetUser.id === reporterId) {
    await ctx.reply("You cannot report yourself.");
    return;
  }

  const chatId = ctx.chat.id;
  const reportedUserId = finalTargetUser.id;
  const reportMessage = finalReason || "No reason provided";

  // Get the message that was replied to (if any)
  let reportedMessageId = null;
  let reportedMessageLink = null;

  if (ctx.message?.reply_to_message) {
    reportedMessageId = ctx.message.reply_to_message.message_id;
    
    // Create a message link if possible
    if (ctx.chat.username) {
      reportedMessageLink = `https://t.me/${ctx.chat.username}/${reportedMessageId}`;
    }
  }

  try {
    const report = new Report({
      chatId,
      reporterId,
      reportedUserId,
      message: reportMessage,
      timestamp: new Date(),
      status: "pending",
      reportedMessageId,
      reportedMessageLink
    });

    await report.save();

    const userName = finalTargetUser.username ? `@${finalTargetUser.username}` : finalTargetUser.first_name;
    await ctx.reply(`✅ Report submitted for ${userName}. Admins will review it shortly.`);
    
    // Notify admins about the new report
    await notifyAdminsAboutReport(ctx, report, finalTargetUser);
  } catch (error) {
    console.error("Error submitting report:", error);
    await ctx.reply("Failed to submit report. Please try again.");
  }
}

/**
 * Notify all admins about a new report
 */
async function notifyAdminsAboutReport(ctx: BotContext, report: any, reportedUser: any): Promise<void> {
  try {
    // Check if there's a designated log channel for this group
    let logChannelId = null;
    try {
      const groupSettings = await GroupSettings.findOne({ chatId: ctx.chat?.id });
      if (groupSettings && groupSettings.logChannel) {
        logChannelId = groupSettings.logChannel;
      }
    } catch (error) {
      console.error("Error fetching group settings:", error);
    }
    
    // Get reporter information
    const reporter = ctx.from;
    const reporterName = reporter?.username ? `@${reporter.username}` : reporter?.first_name || "Unknown";
    
    // Create a notification message
    let reportNotification = `
🚨 <b>New Report Submitted</b>

<b>Reported User:</b> ${reportedUser.username ? `@${reportedUser.username}` : reportedUser.first_name}
<b>Reported By:</b> ${reporterName}
<b>Reason:</b> ${report.message}
<b>Chat:</b> ${ctx.chat?.title || "Unknown"}
`;

    // Add message link if available
    if (report.reportedMessageLink) {
      reportNotification += `\n<b>Reported Message:</b> <a href="${report.reportedMessageLink}">Link to message</a>`;
    }

    reportNotification += `\n\n<i>Use</i> /reports <i>in the group chat to view all pending reports</i>`;

    // Try to send to the log channel if configured
    let sentToLogChannel = false;
    if (logChannelId) {
      try {
        await ctx.api.sendMessage(logChannelId, reportNotification, {
          parse_mode: "HTML"
        });
        sentToLogChannel = true;
      } catch (error) {
        console.error(`Failed to send report to log channel ${logChannelId}:`, error);
      }
    }

    // If no log channel or failed to send to log channel, send a notification in the group
    if (!sentToLogChannel) {
      try {
        // Send a notification to the group
        await ctx.reply(
          "⚠️ <b>A report has been submitted</b>. Admins, use /reports to view pending reports.",
          { parse_mode: "HTML" }
        );
      } catch (error) {
        console.error("Failed to send group notification about report:", error);
      }
    }
  } catch (error) {
    console.error("Error notifying admins about report:", error);
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

    let reportText = "<b>📋 Pending Reports</b>\n\n";
    
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      try {
        const reporter = await ctx.api.getChatMember(chatId, report.reporterId);
        const reportedUser = await ctx.api.getChatMember(chatId, report.reportedUserId);
        
        const reporterName = reporter.user.username ? `@${reporter.user.username}` : reporter.user.first_name;
        const reportedName = reportedUser.user.username ? `@${reportedUser.user.username}` : reportedUser.user.first_name;
        
        // Create a mention for the reported user (this will notify/point to them)
        const reportedMention = `<a href="tg://user?id=${report.reportedUserId}">${reportedName}</a>`;
        
        reportText += `<b>Report #${i + 1}</b> (ID: ${report._id})\n`;
        reportText += `👤 <b>Reported:</b> ${reportedMention}\n`;
        reportText += `📝 <b>By:</b> ${reporterName}\n`;
        reportText += `💬 <b>Reason:</b> ${report.message}\n`;
        reportText += `⏰ <b>Time:</b> ${report.timestamp.toLocaleString()}\n`;
        
        // Add message link if available
        if (report.reportedMessageLink) {
          reportText += `🔗 <b>Message:</b> <a href="${report.reportedMessageLink}">View reported message</a>\n`;
        } else if (report.reportedMessageId) {
          reportText += `🔗 <b>Message ID:</b> ${report.reportedMessageId}\n`;
        }
        
        reportText += `\n`;
      } catch (error) {
        console.error(`Error processing report ${report._id}:`, error);
        reportText += `<b>Report #${i + 1}</b> - Error loading details\n\n`;
      }
    }

    reportText += "<i>To handle a report, use the appropriate moderation commands (/warn, /mute, /kick, etc.)</i>\n";
    reportText += "<i>To remove a report, use</i> <code>/resolve [report ID or @username]</code>";

    await ctx.reply(reportText, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error fetching reports:", error);
    await ctx.reply("Failed to fetch reports. Please try again.");
  }
}

export async function resolveReport(ctx: BotContext): Promise<void> {
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

  // Extract report ID or username from command
  const text = ctx.message?.text;
  if (!text) {
    await ctx.reply("Please provide a report ID or username: /resolve [report ID or @username]");
    return;
  }

  const parts = text.split(" ");
  if (parts.length < 2) {
    await ctx.reply("Please provide a report ID or username: /resolve [report ID or @username]");
    return;
  }

  const identifier = parts[1].trim();
  const chatId = ctx.chat.id;

  try {
    let report;
    
    // Check if it's a username
    if (identifier.startsWith("@")) {
      const username = identifier.substring(1); // Remove @ symbol
      
      try {
        // Try to find reports by this username
        // First, get all pending reports for this chat
        const pendingReports = await Report.find({ 
          chatId, 
          status: "pending" 
        }).sort({ timestamp: -1 });
        
        if (pendingReports.length === 0) {
          await ctx.reply("No pending reports found in this chat.");
          return;
        }
        
        // For each report, try to get the user info and match username
        let matchedReports = [];
        
        for (const pendingReport of pendingReports) {
          try {
            const reportedUser = await ctx.api.getChatMember(chatId, pendingReport.reportedUserId);
            if (reportedUser.user.username && 
                reportedUser.user.username.toLowerCase() === username.toLowerCase()) {
              matchedReports.push(pendingReport);
            }
          } catch (error) {
            console.log(`Could not get info for user ${pendingReport.reportedUserId}`);
          }
        }
        
        if (matchedReports.length === 0) {
          await ctx.reply(`No pending reports found for user ${identifier}.`);
          return;
        } else if (matchedReports.length === 1) {
          report = matchedReports[0];
        } else {
          // Multiple reports found, use the most recent one
          report = matchedReports[0]; // Already sorted by timestamp desc
          await ctx.reply(`Multiple reports found for ${identifier}. Resolving the most recent one.`);
        }
      } catch (error) {
        console.error("Error finding reports by username:", error);
        await ctx.reply(`Error finding reports for ${identifier}. Please try using a report ID instead.`);
        return;
      }
    } else {
      // Assume it's a report ID
      try {
        report = await Report.findOne({ _id: identifier, chatId });
      } catch (error) {
        console.error("Invalid report ID format:", error);
        await ctx.reply("Invalid report ID format. Please provide a valid report ID or username.");
        return;
      }
      
      if (!report) {
        // Try to find by a partial ID match
        try {
          const reports = await Report.find({ 
            chatId,
            status: "pending",
            _id: { $regex: new RegExp(identifier, 'i') }
          });
          
          if (reports.length === 1) {
            report = reports[0];
          } else if (reports.length > 1) {
            let message = "Multiple matching reports found. Please be more specific:\n";
            reports.slice(0, 5).forEach((r, i) => {
              message += `${i+1}. ID: ${r._id}\n`;
            });
            if (reports.length > 5) {
              message += `...and ${reports.length - 5} more.`;
            }
            await ctx.reply(message);
            return;
          } else {
            await ctx.reply("No reports found with that ID. Use /reports to see all pending reports.");
            return;
          }
        } catch (error) {
          console.error("Error searching for reports:", error);
          await ctx.reply("No reports found with that ID. Use /reports to see all pending reports.");
          return;
        }
      }
    }
    
    if (!report) {
      await ctx.reply("No matching report found. Use /reports to see all pending reports.");
      return;
    }
    
    if (report.status !== "pending") {
      await ctx.reply("This report has already been resolved.");
      return;
    }

    // Update report status
    report.status = "resolved";
    await report.save();

    // Get reported user info
    let reportedUserInfo = "";
    try {
      const reportedUser = await ctx.api.getChatMember(chatId, report.reportedUserId);
      reportedUserInfo = reportedUser.user.username 
        ? `@${reportedUser.user.username}` 
        : reportedUser.user.first_name;
    } catch (error) {
      reportedUserInfo = `User ID: ${report.reportedUserId}`;
    }

    await ctx.reply(`✅ Report for ${reportedUserInfo} has been marked as resolved.`);
  } catch (error) {
    console.error("Error resolving report:", error);
    await ctx.reply("Failed to resolve report. Please check the ID or username and try again.");
  }
}

/**
 * Set up a log channel for reports
 */
export async function setReportChannel(ctx: BotContext): Promise<void> {
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }

  // Only allow in group chats
  if (ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in group chats.");
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

  // Extract channel ID from command
  const text = ctx.message?.text;
  if (!text) {
    await ctx.reply("Please provide a channel ID: /setreportchannel [channel ID]");
    return;
  }

  const parts = text.split(" ");
  if (parts.length < 2) {
    await ctx.reply("Please provide a channel ID: /setreportchannel [channel ID]");
    return;
  }

  const channelId = Number(parts[1].trim());
  if (isNaN(channelId)) {
    await ctx.reply("Invalid channel ID. Please provide a valid numeric ID.");
    return;
  }

  const chatId = ctx.chat.id;

  try {
    // Check if the bot can send messages to this channel
    try {
      await ctx.api.sendMessage(channelId, "Testing channel access for reports. This message can be deleted.", {
        disable_notification: true
      });
    } catch (error) {
      await ctx.reply("Failed to send a test message to the channel. Make sure the bot is an admin in the channel with permission to post messages.");
      return;
    }

    // Update or create group settings
    let groupSettings = await GroupSettings.findOne({ chatId });
    
    if (!groupSettings) {
      groupSettings = new GroupSettings({
        chatId,
        logChannel: channelId
      });
    } else {
      groupSettings.logChannel = channelId;
    }
    
    await groupSettings.save();
    
    await ctx.reply(`✅ Report channel has been set successfully. Reports will now be sent to the specified channel.`);
  } catch (error) {
    console.error("Error setting report channel:", error);
    await ctx.reply("Failed to set report channel. Please try again.");
  }
} 