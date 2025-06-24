import { Bot, Middleware } from "grammy";
import { hydrate } from "@grammyjs/hydrate";
import { conversations } from "@grammyjs/conversations";
// import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import { connectToDatabase } from "./db/connection";
import { registerModerationCommands } from "./commands/moderation";
import { registerAdminCommands } from "./commands/admin";
import { registerUserCommands } from "./commands/user";
import { registerFunCommands } from "./commands/fun";
import { applyMiddleware } from "./middleware";
import { BotContext } from "./types";
import { session } from "grammy";
import { loadRemindersFromDatabase } from "./commands/fun/remindmeCommand";

// Load environment variables
if (!process.env.BOT_TOKEN) {
  console.error("Error: BOT_TOKEN environment variable is not set");
  process.exit(1);
}

// Create bot instance
const bot = new Bot<BotContext>(process.env.BOT_TOKEN);

// Apply grammY flavors
bot.use(hydrate());
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
// bot.use(parseMode("HTML") as any);
// bot.use(hydrateReply as any);

// Apply custom middleware
applyMiddleware(bot);

// Register commands
registerModerationCommands(bot);
registerAdminCommands(bot);
registerUserCommands(bot);
registerFunCommands(bot);

// Start the bot
async function startBot() {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Load active reminders from database
    await loadRemindersFromDatabase(bot);
    
    // Start the bot
    console.log("Starting bot...");
    await bot.start();
    console.log("Bot is running!");
  } catch (error) {
    console.error("Failed to start bot:", error);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Stopping bot...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Stopping bot...");
  process.exit(0);
});

// Run the bot
startBot(); 