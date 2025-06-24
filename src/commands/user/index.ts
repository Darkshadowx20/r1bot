import { Bot } from "grammy";
import { BotContext } from "../../types";
import { startCommand } from "./startCommand";
import { helpCommand } from "./helpCommand";
import { rulesCommand } from "./rulesCommand";
import { groupinfoCommand } from "./groupinfoCommand";
import { userinfoCommand } from "./userinfoCommand";
import { pingCommand } from "./pingCommand";
import { reportCommand, getReports, resolveReport, setReportChannel } from "./reportCommand";

export function registerUserCommands(bot: Bot<BotContext>): void {
  // Basic commands
  bot.command("start", startCommand);
  bot.command("help", helpCommand);
  
  // Group info commands
  bot.command("rules", rulesCommand);
  bot.command("groupinfo", groupinfoCommand);
  bot.command("userinfo", userinfoCommand);
  
  // Utility commands
  bot.command("ping", pingCommand);
  bot.command("report", reportCommand);
  bot.command("reports", getReports);
  bot.command("resolve", resolveReport);
  bot.command("setreportchannel", setReportChannel);
} 