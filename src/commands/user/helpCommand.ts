import { BotContext } from "../../types";
import { isAdmin } from "../../middleware/adminMiddleware";

export async function helpCommand(ctx: BotContext): Promise<void> {
  // Check if user is admin to show admin commands
  let isUserAdmin = false;
  
  if (ctx.from && ctx.chat) {
    isUserAdmin = await isAdmin(ctx, ctx.from.id);
  }
  
  // Basic commands for all users
  let helpText = `
<b>📚 Available Commands</b>

<b>User Commands:</b>
/rules - Show group rules
/groupinfo - Show information about the group
/userinfo - Show information about yourself or another user
/ping - Check if bot is online
/report - Report a user to admins

<b>AFK Commands:</b>
/afk [reason] - Set yourself as AFK
/back - Mark yourself as back
`;

  // Admin commands
  if (isUserAdmin) {
    helpText += `
<b>Admin Commands:</b>
/ban - Ban a user from the group
/kick - Kick a user from the group
/mute [duration] - Temporarily mute a user
/unmute - Remove mute from a user
/warn - Give a warning to a user
/unwarn - Remove one or all warnings
/warns - Check a user's warning count
/slowmode [seconds] - Set slowmode delay
/cleanup [n] - Delete the last n messages
/setrules - Set group rules
/pin - Pin a message
/unpin - Unpin a message
/settings - Configure group settings
/welcome - Set welcome message
/goodbye - Set goodbye message
`;
  }

  // Send the help text
  await ctx.reply(helpText, {
    parse_mode: "HTML"
  });
} 