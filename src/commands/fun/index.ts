import { Bot } from "grammy";
import { BotContext } from "../../types";
import { afkCommand } from "./afkCommand";
import { backCommand } from "./backCommand";
import { repCommand } from "./repCommand";
import { pollCommand } from "./pollCommand";
import { remindmeCommand } from "./remindmeCommand";

export function registerFunCommands(bot: Bot<BotContext>): void {
  // AFK commands
  bot.command("afk", afkCommand);
  bot.command("back", backCommand);
  
  // Reputation command
  bot.command("rep", repCommand);
  
  // Poll command
  bot.command("poll", pollCommand);
  
  // Reminder command
  bot.command("remindme", remindmeCommand);
} 