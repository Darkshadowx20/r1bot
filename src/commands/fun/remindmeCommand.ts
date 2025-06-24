import { BotContext } from "../../types";
import { parseDuration, formatDuration } from "../../utils/timeUtils";
import { Reminder, IReminder } from "../../db/Reminder";

// Store active reminders in memory (for the current session)
const activeReminders = new Map<string, NodeJS.Timeout>();

// No need for ReminderDetails interface as we're using the database model

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

  // Check if user wants to list or cancel reminders
  if (commandParts[0] === "list") {
    await listReminders(ctx);
    return;
  } else if (commandParts[0] === "cancel" && commandParts[1]) {
    await cancelReminder(ctx, commandParts[1]);
    return;
  }
  
  if (commandParts.length < 2) {
    await ctx.reply(
      "📝 <b>Reminder Help</b>\n\n" +
      "Set a reminder:\n" +
      "<code>/remindme 10m Take a break</code>\n\n" +
      "List your reminders:\n" +
      "<code>/remindme list</code>\n\n" +
      "Cancel a reminder:\n" +
      "<code>/remindme cancel [ID]</code>\n\n" +
      "<b>Time formats:</b>\n" +
      "• <code>30s</code> - 30 seconds\n" +
      "• <code>5m</code> - 5 minutes\n" +
      "• <code>2h</code> - 2 hours\n" +
      "• <code>1d</code> - 1 day\n" +
      "• <code>1h30m</code> - 1 hour and 30 minutes",
      { parse_mode: "HTML" }
    );
    return;
  }
  
  // Extract the duration
  const durationStr = commandParts[0];
  const duration = parseDuration(durationStr);
  
  if (!duration) {
    await ctx.reply(
      "⚠️ Please provide a valid duration (e.g., 10m, 1h, 2h30m).\n" +
      "Example: /remindme 10m Take a break",
      { parse_mode: "HTML" }
    );
    return;
  }
  
  // Extract the reminder message
  const reminderMessage = commandParts.slice(1).join(" ");
  
  if (!reminderMessage) {
    await ctx.reply(
      "⚠️ Please provide a reminder message.\n" +
      "Example: /remindme 10m Take a break",
      { parse_mode: "HTML" }
    );
    return;
  }
  
  // Calculate the reminder time
  const now = new Date();
  const reminderTime = new Date(now.getTime() + duration);
  
  // Generate a unique ID for this reminder
  const reminderId = generateReminderId();
  const userId = ctx.from.id;
  const chatId = ctx.chat?.id || userId;
  const username = ctx.from.username;
  const firstName = ctx.from.first_name;
  
  // Format the reminder time nicely
  const formattedDuration = formatDuration(duration);
  const formattedTime = reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  try {
    // Create and save reminder to database
    const reminder = new Reminder({
      reminderId,
      userId,
      chatId,
      message: reminderMessage,
      createdAt: now,
      reminderTime,
      duration,
      isActive: true,
      username,
      firstName
    });
    
    await reminder.save();
    
    // Store the reminder key for this user
    const reminderKey = `${userId}:${reminderId}`;
    
    // No need to store in memory since we're using database
    
    // Send confirmation
    await ctx.reply(
      `⏰ <b>Reminder Set!</b>\n\n` +
      `I'll remind you about "<i>${reminderMessage}</i>" in <b>${formattedDuration}</b>.\n` +
      `Time: <b>${formattedTime}</b>\n\n` +
      `Reminder ID: <code>${reminderId}</code>\n` +
      `(Use <code>/remindme cancel ${reminderId}</code> to cancel)`,
      { parse_mode: "HTML" }
    );
    
    // Set the reminder
    const timeout = setTimeout(async () => {
      try {
        // Mark reminder as inactive in database
        await Reminder.findOneAndUpdate(
          { userId, reminderId },
          { isActive: false }
        );
        
        // Remove from active reminders
        activeReminders.delete(reminderKey);
        
        // Try to send a direct message first
        try {
          await ctx.api.sendMessage(
            userId,
            `⏰ <b>REMINDER</b> ⏰\n\n${reminderMessage}`,
            { parse_mode: "HTML" }
          );
        } catch (dmError) {
          // DM failed, will handle in the chat
          console.log(`Failed to send reminder DM to user ${userId}`);
        }
        
        // If the reminder was set in a group, also send a notification there
        if (ctx.chat && ctx.chat.type !== "private") {
          const mention = username 
            ? `@${username}` 
            : `<a href="tg://user?id=${userId}">${firstName}</a>`;
          
          await ctx.reply(
            `⏰ <b>REMINDER</b> ⏰\n\n` +
            `${mention}, here's your reminder:\n` +
            `<i>${reminderMessage}</i>`,
            { parse_mode: "HTML" }
          );
        }
      } catch (error) {
        console.error("Error sending reminder:", error);
        
        // If failed to send to user directly, try to send only to the chat
        if (ctx.chat) {
          try {
            const mention = username 
              ? `@${username}` 
              : `<a href="tg://user?id=${userId}">${firstName}</a>`;
            
            await ctx.reply(
              `⏰ <b>REMINDER</b> ⏰\n\n` +
              `${mention}, here's your reminder:\n` +
              `<i>${reminderMessage}</i>\n\n` +
              `<i>Note: I couldn't send you a direct message. Please start a private chat with me to receive reminders directly.</i>`,
              { parse_mode: "HTML" }
            );
          } catch (chatError) {
            console.error("Error sending reminder to chat:", chatError);
          }
        }
      }
    }, duration);
    
    // Store the timeout so we can cancel it if needed
    activeReminders.set(reminderKey, timeout);
    
    // Log the reminder
    console.log(`Reminder ${reminderId} set for user ${userId} at ${reminderTime.toISOString()}: ${reminderMessage}`);
  } catch (error) {
    console.error("Error saving reminder to database:", error);
    await ctx.reply("❌ Failed to set reminder. Please try again.");
  }
}

// Helper function to generate a random reminder ID
function generateReminderId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// List all active reminders for a user
async function listReminders(ctx: BotContext): Promise<void> {
  if (!ctx.from) return;
  
  const userId = ctx.from.id;
  
  try {
    // Find all active reminders for this user from the database
    const reminders = await Reminder.find({ 
      userId, 
      isActive: true 
    }).sort({ reminderTime: 1 });
    
    if (reminders.length === 0) {
      await ctx.reply("You don't have any active reminders.", { parse_mode: "HTML" });
      return;
    }
    
    let remindersList = "";
    
    // Build the list of reminders
    for (const reminder of reminders) {
      // Format the time remaining
      const timeLeft = reminder.reminderTime.getTime() - Date.now();
      const timeLeftFormatted = formatDuration(timeLeft);
      
      // Format the reminder time
      const reminderTime = reminder.reminderTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
      
      // Truncate message if too long
      const truncatedMessage = reminder.message.length > 30 
        ? reminder.message.substring(0, 27) + "..." 
        : reminder.message;
      
      remindersList += `<b>ID:</b> <code>${reminder.reminderId}</code>\n` +
                       `<b>Message:</b> "${truncatedMessage}"\n` +
                       `<b>Time:</b> ${reminderTime}\n` +
                       `<b>In:</b> ${timeLeftFormatted}\n\n`;
    }
    
    await ctx.reply(
      `📋 <b>Your Active Reminders (${reminders.length})</b>\n\n` +
      `${remindersList}` +
      `Use <code>/remindme cancel [ID]</code> to cancel a reminder.`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error fetching reminders from database:", error);
    await ctx.reply("❌ Failed to fetch reminders. Please try again.");
  }
}

// Cancel a specific reminder
async function cancelReminder(ctx: BotContext, reminderId: string): Promise<void> {
  if (!ctx.from) return;
  
  const userId = ctx.from.id;
  const reminderKey = `${userId}:${reminderId}`;
  
  try {
    // Find and update the reminder in the database
    const reminder = await Reminder.findOneAndUpdate(
      { userId, reminderId, isActive: true },
      { isActive: false }
    );
    
    if (!reminder) {
      await ctx.reply(
        `⚠️ Reminder <code>${reminderId}</code> not found. Check your active reminders with <code>/remindme list</code>`,
        { parse_mode: "HTML" }
      );
      return;
    }
    
    // Clear the timeout if it exists in memory
    if (activeReminders.has(reminderKey)) {
      clearTimeout(activeReminders.get(reminderKey));
      activeReminders.delete(reminderKey);
    }
    
    await ctx.reply(
      `✅ Reminder <code>${reminderId}</code> has been cancelled.\n\n` +
      `Message: "${reminder.message}"`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error cancelling reminder:", error);
    await ctx.reply("❌ Failed to cancel reminder. Please try again.");
  }
}

// Function to load active reminders from database on bot startup
export async function loadRemindersFromDatabase(bot: any): Promise<void> {
  try {
    console.log("Loading active reminders from database...");
    
    // Find all active reminders that haven't expired yet
    const now = new Date();
    const reminders = await Reminder.find({
      isActive: true,
      reminderTime: { $gt: now }
    });
    
    console.log(`Found ${reminders.length} active reminders to load`);
    
    // Set up timeouts for each reminder
    for (const reminder of reminders) {
      const timeLeft = reminder.reminderTime.getTime() - now.getTime();
      const userId = reminder.userId;
      const chatId = reminder.chatId;
      const reminderId = reminder.reminderId;
      const message = reminder.message;
      const username = reminder.username;
      const firstName = reminder.firstName || "User";
      
      // Only set reminders that are in the future
      if (timeLeft <= 0) continue;
      
      const reminderKey = `${userId}:${reminderId}`;
      
      // Set the reminder
      const timeout = setTimeout(async () => {
        try {
          // Mark reminder as inactive in database
          await Reminder.findOneAndUpdate(
            { userId, reminderId },
            { isActive: false }
          );
          
          // Remove from active reminders
          activeReminders.delete(reminderKey);
          
          // Try to send a direct message first
          try {
            await bot.api.sendMessage(
              userId,
              `⏰ <b>REMINDER</b> ⏰\n\n${message}`,
              { parse_mode: "HTML" }
            );
          } catch (dmError) {
            console.log(`Failed to send reminder DM to user ${userId}`);
            
            // Try to send to the chat if DM fails
            if (chatId !== userId) {
              try {
                const mention = username 
                  ? `@${username}` 
                  : `<a href="tg://user?id=${userId}">${firstName}</a>`;
                
                await bot.api.sendMessage(
                  chatId,
                  `⏰ <b>REMINDER</b> ⏰\n\n` +
                  `${mention}, here's your reminder:\n` +
                  `<i>${message}</i>`,
                  { parse_mode: "HTML" }
                );
              } catch (chatError) {
                console.error("Error sending reminder to chat:", chatError);
              }
            }
          }
        } catch (error) {
          console.error("Error processing loaded reminder:", error);
        }
      }, timeLeft);
      
      // Store the timeout
      activeReminders.set(reminderKey, timeout);
      
      console.log(`Loaded reminder ${reminderId} for user ${userId}, triggering in ${formatDuration(timeLeft)}`);
    }
  } catch (error) {
    console.error("Error loading reminders from database:", error);
  }
} 