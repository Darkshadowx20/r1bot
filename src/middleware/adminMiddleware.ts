import { NextFunction } from "grammy";
import { BotContext } from "../types";

// Check if a user is an admin in the chat
export async function isAdmin(ctx: BotContext, userId: number): Promise<boolean> {
  try {
    if (!ctx.chat?.id) return false;
    
    // For private chats, check if user is in admin list
    if (ctx.chat.type === "private") {
      const adminIds = process.env.ADMIN_USER_IDS?.split(",").map(Number) || [];
      return adminIds.includes(userId);
    }
    
    // For groups, check Telegram admin status
    const member = await ctx.getChatMember(userId);
    return ["administrator", "creator"].includes(member.status);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Middleware to check if command sender is an admin
export async function adminMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  // Skip admin check for non-command messages
  if (!ctx.message?.text?.startsWith("/")) {
    return next();
  }
  
  // Get command name
  const command = ctx.message.text.split(" ")[0].substring(1);
  
  // List of admin-only commands
  const adminCommands = [
    "ban", "kick", "mute", "unmute", "warn", "unwarn", 
    "setrules", "pin", "slowmode", "cleanup", 
    "settings", "welcome", "goodbye"
  ];
  
  // Check if this is an admin-only command
  if (adminCommands.includes(command)) {
    const userId = ctx.from?.id;
    
    if (!userId) {
      await ctx.reply("Could not identify user.");
      return;
    }
    
    const admin = await isAdmin(ctx, userId);
    
    if (!admin) {
      await ctx.reply("This command is only available to administrators.");
      return;
    }
  }
  
  return next();
} 