import { Bot } from "grammy";
import { adminMiddleware } from "./adminMiddleware";
import { afkMiddleware } from "./afkMiddleware";
import { antiSpamMiddleware } from "./antiSpamMiddleware";
import { languageFilterMiddleware } from "./languageFilterMiddleware";
import { linkFilterMiddleware } from "./linkFilterMiddleware";
import { loggerMiddleware } from "./loggerMiddleware";
import { wordFilterMiddleware } from "./wordFilterMiddleware";
import { BotContext } from "../types";
import { cacheUser } from "../utils/commandUtils";

/**
 * Apply all middleware to the bot
 */
export function applyMiddleware(bot: Bot<BotContext>): void {
  // User caching middleware (must be first)
  bot.use(async (ctx, next) => {
    if (ctx.chat && ctx.from) {
      cacheUser(ctx.chat.id, ctx.from);
    }
    await next();
  });

  // Apply admin middleware
  bot.use(adminMiddleware);
  
  // Apply filter middleware
  bot.use(antiSpamMiddleware);
  bot.use(linkFilterMiddleware);
  bot.use(wordFilterMiddleware);
  bot.use(languageFilterMiddleware);
  
  // Apply AFK middleware
  bot.use(afkMiddleware);
  
  // Apply logger middleware (should be last to log all actions)
  bot.use(loggerMiddleware);
} 