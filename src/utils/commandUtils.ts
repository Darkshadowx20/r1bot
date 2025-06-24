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

// Simple hash function to generate a numeric ID from a string
export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure it's positive and doesn't conflict with real Telegram IDs
  return Math.abs(hash) + 1000000000;
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
  
  // Cache the sender if they have a username
  if (ctx.from && ctx.chat) {
    cacheUser(ctx.chat.id, ctx.from);
  }
  
  // Check if the command is a reply to a message
  if (ctx.message?.reply_to_message?.from) {
    targetUser = ctx.message.reply_to_message.from;
    
    // Cache this user if they have a username
    if (ctx.chat && targetUser.username) {
      cacheUser(ctx.chat.id, targetUser);
    }
    
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
                // User not in chat anymore or bot doesn't have permission
                console.log(`Cached user ${cached.id} not accessible in chat`);
              }
            }
            
            // Fallback: search through chat administrators
            if (!targetUser) {
              try {
                const chatMembers = await ctx.getChatAdministrators();
                const foundMember = chatMembers.find(
                  (member: ChatMember) => 
                    member.user.username && 
                    member.user.username.toLowerCase() === username.toLowerCase()
                );
                if (foundMember) {
                  targetUser = foundMember.user;
                  // Cache this admin
                  cacheUser(ctx.chat.id, foundMember.user);
                }
              } catch (adminError) {
                console.error("Error getting chat administrators:", adminError);
              }
            }
            
            // If still not found, create a virtual user with the username
            if (!targetUser) {
              // Create a virtual user with a consistent ID based on username and chat
              const virtualId = hashStringToNumber(`${username.toLowerCase()}:${ctx.chat.id}`);
              targetUser = {
                id: virtualId,
                is_bot: false,
                first_name: username,
                username: username
              };
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
            
            // Cache this user if they have a username
            if (ctx.chat && targetUser.username) {
              cacheUser(ctx.chat.id, targetUser);
            }
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