import { BotContext } from "../../types";
import { parseDuration, formatDuration } from "../../utils/timeUtils";

export async function remindmeCommand(ctx: BotContext): Promise<void> {
  // Make sure we have a user
  if (!ctx.from) {
    await ctx.reply("Could not identify user.");
    return;
  }
  
  // Get the reminder text and duration
  const text = ctx.message?.text || "";
  const commandParts = text.split(/\s+/);
  
  // Remove the command itself
  commandParts.shift();
  
  if (commandParts.length < 2) {
    await ctx.reply(
      "Please provide a duration and a reminder message.\n" +
      "Example: /remindme 10m Take a break"
    );
    return;
  }
  
  // Extract the duration
  const durationStr = commandParts[0];
  const duration = parseDuration(durationStr);
  
  if (!duration) {
    await ctx.reply(
      "Please provide a valid duration (e.g., 10m, 1h, 2h30m).\n" +
      "Example: /remindme 10m Take a break"
    );
    return;
  }
  
  // Extract the reminder message
  const reminderMessage = commandParts.slice(1).join(" ");
  
  if (!reminderMessage) {
    await ctx.reply(
      "Please provide a reminder message.\n" +
      "Example: /remindme 10m Take a break"
    );
    return;
  }
  
  // Calculate the reminder time
  const now = new Date();
  const reminderTime = new Date(now.getTime() + duration);
  
  // In a real implementation, this would be stored in a database
  // For now, we'll use setTimeout
  const formattedDuration = formatDuration(duration);
  
  await ctx.reply(`✅ I'll remind you about "${reminderMessage}" in ${formattedDuration}.`);
  
  // Set the reminder
  setTimeout(async () => {
    try {
      await ctx.api.sendMessage(
        ctx.from!.id,
        `⏰ Reminder: ${reminderMessage}`
      );
      
      // If the reminder was set in a group, also send a notification there
      if (ctx.chat && ctx.chat.type !== "private") {
        await ctx.reply(
          `⏰ @${ctx.from!.username || ctx.from!.first_name}, here's your reminder: ${reminderMessage}`
        );
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      
      // If failed to send to user directly, try to send only to the chat
      if (ctx.chat) {
        try {
          await ctx.reply(
            `⏰ ${ctx.from!.username ? `@${ctx.from!.username}` : ctx.from!.first_name}, here's your reminder: ${reminderMessage}\n\n` +
            "Note: I couldn't send you a direct message. Please start a private chat with me to receive reminders directly."
          );
        } catch (chatError) {
          console.error("Error sending reminder to chat:", chatError);
        }
      }
    }
  }, duration);
  
  // Log the reminder
  console.log(`Reminder set for user ${ctx.from.id} at ${reminderTime.toISOString()}: ${reminderMessage}`);
} 