import { Bot } from "grammy";
import { BotContext } from "../../types";
import { slowmodeCommand } from "./slowmodeCommand";
import { pinCommand } from "./pinCommand";
import { unpinCommand } from "./unpinCommand";
import { setrulesCommand } from "./setrulesCommand";
import { settingsCommand } from "./settingsCommand";
import { welcomeCommand } from "./welcomeCommand";
import { goodbyeCommand } from "./goodbyeCommand";

export function registerAdminCommands(bot: Bot<BotContext>): void {
  // Slowmode command
  bot.command("slowmode", slowmodeCommand);
  
  // Pin commands
  bot.command("pin", pinCommand);
  bot.command("unpin", unpinCommand);
  
  // Rules command
  bot.command("setrules", setrulesCommand);
  
  // Settings command
  bot.command("settings", settingsCommand);
  
  // Welcome and goodbye messages
  bot.command("welcome", welcomeCommand);
  bot.command("goodbye", goodbyeCommand);
} 