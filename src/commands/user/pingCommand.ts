import { BotContext } from "../../types";

// Store the bot start time
const botStartTime = new Date();

export async function pingCommand(ctx: BotContext): Promise<void> {
  // Calculate uptime
  const uptime = Date.now() - botStartTime.getTime();
  const uptimeStr = formatUptime(uptime);
  
  // Calculate response time
  const start = Date.now();
  const message = await ctx.reply("Pinging...");
  const responseTime = Date.now() - start;
  
  // Edit the message with ping results
  await ctx.api.editMessageText(
    ctx.chat!.id,
    message.message_id,
    `🏓 Pong!\n\nResponse time: ${responseTime}ms\nBot uptime: ${uptimeStr}`
  );
}

// Helper function to format uptime
function formatUptime(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  const parts = [];
  
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  
  return parts.join(" ");
} 