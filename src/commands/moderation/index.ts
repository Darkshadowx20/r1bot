import { Bot } from "grammy";
import { BotContext } from "../../types";
import { banCommand } from "./banCommand";
import { kickCommand } from "./kickCommand";
import { muteCommand } from "./muteCommand";
import { unmuteCommand } from "./unmuteCommand";
import { warnCommand } from "./warnCommand";
import { unwarnCommand } from "./unwarnCommand";
import { warnsCommand } from "./warnsCommand";
import { cleanupCommand } from "./cleanupCommand";

export function registerModerationCommands(bot: Bot<BotContext>): void {
  // Ban and kick commands
  bot.command("ban", banCommand);
  bot.command("kick", kickCommand);
  
  // Mute commands
  bot.command("mute", muteCommand);
  bot.command("unmute", unmuteCommand);
  
  // Warning commands
  bot.command("warn", warnCommand);
  bot.command("unwarn", unwarnCommand);
  bot.command("warns", warnsCommand);
  
  // Cleanup command
  bot.command("cleanup", cleanupCommand);
} 