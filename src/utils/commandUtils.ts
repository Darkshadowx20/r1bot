import { BotContext } from "../types";
import { User, ChatMember } from "grammy/types";

// User cache: chatId:username -> user info
const userCache: Map<string, { id: number, username: string, first_name: string, last_name?: string }> = new Map();

export function cacheUser(chatId: number, user: { id: number, username?: string, first_name: string, last_name?: string }) {
  if (user.username) {
    userCache.set(`${chatId}:${user.username.toLowerCase()}`, {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
    });
  }
}

export function getCachedUser(chatId: number, username: string) {
  return userCache.get(`${chatId}:${username.toLowerCase()}`);
}

/**
 * Extract a target user and reason from a command
 * Works with:
 * - Reply to a message
 * - @username mention
 * - User ID
 * - Forward from a user
 */
export async function extractUserAndReason(ctx: BotContext): Promise<{
  targetUser: User | null;
  reason: string | null;
}> {
  let targetUser: User | null = null;
  let reason: string | null = null;
  
  // Check if the command is a reply to a message
  if (ctx.message?.reply_to_message?.from) {
    targetUser = ctx.message.reply_to_message.from;
    
    // Get reason from command text
    const text = ctx.message.text || "";
    const commandParts = text.split(/\s+/);
    
    // Remove the command itself
    commandParts.shift();
    
    // Join the rest as the reason
    if (commandParts.length > 0) {
      reason = commandParts.join(" ");
    }
  } else {
    // Get command text
    const text = ctx.message?.text || "";
    const commandParts = text.split(/\s+/);
    
    // Remove the command itself
    commandParts.shift();
    
    if (commandParts.length > 0) {
      const firstPart = commandParts[0];
      
      // Check if it's a username mention
      if (firstPart.startsWith("@")) {
        const username = firstPart.substring(1);
        try {
          if (ctx.chat) {
            // Try to get user from cache first
            const cached = getCachedUser(ctx.chat.id, username);
            if (cached) {
              try {
                const chatMember = await ctx.getChatMember(cached.id);
                targetUser = chatMember.user;
              } catch (e) {
                // User not in chat anymore
              }
            }
            // If not found in cache, try to resolve the username to a user ID using getChat
            if (!targetUser) {
              let userId: number | null = null;
              try {
                const userChat = await ctx.api.getChat(`@${username}`);
                if (userChat && typeof userChat.id === "number") {
                  userId = userChat.id;
                }
              } catch (resolveError) {
                // getChat will fail for non-public users
                console.log(`Could not resolve @${username} to user ID via getChat`);
              }
              if (userId) {
                try {
                  const chatMember = await ctx.getChatMember(userId);
                  targetUser = chatMember.user;
                } catch (memberError) {
                  console.log(`User ID ${userId} not found in this chat`);
                }
              }
            }
            // Fallback: search through chat administrators
            if (!targetUser) {
              try {
                const chatMembers = await ctx.getChatAdministrators();
                const foundMember = chatMembers.find((member: ChatMember) => member.user.username === username);
                if (foundMember) {
                  targetUser = foundMember.user;
                }
              } catch (adminError) {
                console.error("Error getting chat administrators:", adminError);
              }
            }
          }
        } catch (error) {
          console.error("Error getting chat member by username:", error);
        }
      } else {
        // Check if it's a user ID
        const userId = parseInt(firstPart);
        
        if (!isNaN(userId)) {
          try {
            // Try to get user by ID
            const chatMember = await ctx.getChatMember(userId);
            targetUser = chatMember.user;
          } catch (error) {
            console.error("Error getting chat member by ID:", error);
          }
        }
      }
      
      // If we found a target user, get the reason from the remaining text
      if (targetUser && commandParts.length > 1) {
        reason = commandParts.slice(1).join(" ");
      } else if (!targetUser) {
        // If no target user found, use the entire text as the reason
        reason = commandParts.join(" ");
      }
    }
  }
  
  return { targetUser, reason };
}

/**
 * Parse a duration string like "1h30m" into milliseconds
 */
export function parseDuration(durationStr: string): number | null {
  // Regex to match patterns like 1d, 2h, 30m, 45s
  const regex = /(\d+)([dhms])/g;
  let match: RegExpExecArray | null;
  let totalMs = 0;
  let matched = false;
  
  while ((match = regex.exec(durationStr)) !== null) {
    matched = true;
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case "d":
        totalMs += value * 24 * 60 * 60 * 1000; // days to ms
        break;
      case "h":
        totalMs += value * 60 * 60 * 1000; // hours to ms
        break;
      case "m":
        totalMs += value * 60 * 1000; // minutes to ms
        break;
      case "s":
        totalMs += value * 1000; // seconds to ms
        break;
    }
  }
  
  return matched ? totalMs : null;
}

/**
 * Format a duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  const parts = [];
  
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);
  
  return parts.join(", ");
} 