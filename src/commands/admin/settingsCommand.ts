import { BotContext } from "../../types";
import { isAdmin } from "../../middleware/adminMiddleware";
import { GroupSettings } from "../../db/GroupSettings";

export async function settingsCommand(ctx: BotContext): Promise<void> {
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }

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

  const chatId = ctx.chat.id;

  try {
    let groupSettings = await GroupSettings.findOne({ chatId });
    
    if (!groupSettings) {
      groupSettings = new GroupSettings({ chatId });
      await groupSettings.save();
    }

    const settingsText = `
🔧 **Group Settings**

📝 **Welcome Message:** ${groupSettings.welcomeMessage || "Not set"}
👋 **Goodbye Message:** ${groupSettings.goodbyeMessage || "Not set"}
📋 **Rules:** ${groupSettings.rules ? "Set" : "Not set"}
⏱️ **Slow Mode:** ${groupSettings.slowMode ? `${groupSettings.slowMode}s` : "Disabled"}
🚫 **Anti-Spam:** ${groupSettings.antiSpam ? "Enabled" : "Disabled"}
🔗 **Block Links:** ${groupSettings.blockLinks ? "Enabled" : "Disabled"}
📨 **Block Invites:** ${groupSettings.blockInvites ? "Enabled" : "Disabled"}
📱 **Blocked Media:** ${groupSettings.blockedMedia.length > 0 ? groupSettings.blockedMedia.join(", ") : "None"}
🚫 **Blocked Words:** ${groupSettings.blockedWords.length > 0 ? groupSettings.blockedWords.join(", ") : "None"}
🌐 **Blocked Languages:** ${groupSettings.blockedLanguages.length > 0 ? groupSettings.blockedLanguages.join(", ") : "None"}
✅ **Require Verification:** ${groupSettings.requireVerification ? "Enabled" : "Disabled"}
📊 **Log Channel:** ${groupSettings.logChannel ? "Set" : "Not set"}

Use /settings <option> <value> to change settings.
Example: /settings antiSpam true
    `.trim();

    await ctx.reply(settingsText);
  } catch (error) {
    console.error("Error fetching settings:", error);
    await ctx.reply("Failed to fetch group settings. Please try again.");
  }
}

export async function updateSetting(ctx: BotContext, setting: string, value: string): Promise<void> {
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }

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

  const chatId = ctx.chat.id;

  try {
    let groupSettings = await GroupSettings.findOne({ chatId });
    
    if (!groupSettings) {
      groupSettings = new GroupSettings({ chatId });
    }

    switch (setting.toLowerCase()) {
      case "antispam":
        groupSettings.antiSpam = value.toLowerCase() === "true";
        break;
      case "blocklinks":
        groupSettings.blockLinks = value.toLowerCase() === "true";
        break;
      case "blockinvites":
        groupSettings.blockInvites = value.toLowerCase() === "true";
        break;
      case "requireverification":
        groupSettings.requireVerification = value.toLowerCase() === "true";
        break;
      case "slowmode":
        const slowModeValue = parseInt(value);
        if (isNaN(slowModeValue) || slowModeValue < 0) {
          await ctx.reply("Slow mode must be a positive number or 0 to disable.");
          return;
        }
        groupSettings.slowMode = slowModeValue;
        break;
      default:
        await ctx.reply(`Unknown setting: ${setting}`);
        return;
    }

    await groupSettings.save();
    await ctx.reply(`Setting "${setting}" updated to "${value}" successfully!`);
  } catch (error) {
    console.error("Error updating setting:", error);
    await ctx.reply("Failed to update setting. Please try again.");
  }
} 