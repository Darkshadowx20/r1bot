import { Bot } from "grammy";
import { BotContext } from "../../types";
import { afkCommand } from "./afkCommand";
import { backCommand } from "./backCommand";
import { repCommand, getReputation } from "./repCommand";
import { pollCommand } from "./pollCommand";
import { remindmeCommand } from "./remindmeCommand";
import { topCommand } from "./topCommand";

export function registerFunCommands(bot: Bot<BotContext>): void {
  // AFK commands
  bot.command("afk", afkCommand);
  bot.command("back", backCommand);
  
  // Reputation commands
  bot.command("rep", repCommand);
  bot.command("rep_check", getReputation);
  
  // Reputation leaderboard
  bot.command("top", topCommand);
  
  // Poll command
  bot.command("poll", pollCommand);
  
  // Reminder command
  bot.command("remindme", remindmeCommand);
} 