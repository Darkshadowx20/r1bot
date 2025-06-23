import { BotContext } from "../../types";

export async function pollCommand(ctx: BotContext): Promise<void> {
  // Check if in a group
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("This command can only be used in groups.");
    return;
  }
  
  // Get the poll text and options
  const text = ctx.message?.text || "";
  
  // Parse the command
  // Format: /poll Question? | Option 1 | Option 2 | Option 3
  const parts = text.split("|").map(part => part.trim());
  
  // Extract the question (remove the command)
  let question = parts[0].replace(/^\/poll\s+/i, "").trim();
  
  // Check if the question is provided
  if (!question) {
    await ctx.reply(
      "Please provide a question and options for the poll.\n" +
      "Format: /poll Question? | Option 1 | Option 2 | Option 3"
    );
    return;
  }
  
  // Extract the options
  const options = parts.slice(1).filter(option => option.length > 0);
  
  // Check if enough options are provided
  if (options.length < 2) {
    await ctx.reply(
      "Please provide at least 2 options for the poll.\n" +
      "Format: /poll Question? | Option 1 | Option 2 | Option 3"
    );
    return;
  }
  
  // Limit to 10 options (Telegram's limit)
  const limitedOptions = options.slice(0, 10);
  const pollOptions = limitedOptions.map(option => ({ text: option }));
  
  try {
    // Send the poll
    await ctx.replyWithPoll(
      question,
      pollOptions,
      {
        is_anonymous: false,
        allows_multiple_answers: false
      }
    );
  } catch (error) {
    console.error("Error sending poll:", error);
    await ctx.reply("Failed to create poll. Please try again.");
  }
} 