import { BotContext } from "../../types";

export async function groupinfoCommand(ctx: BotContext): Promise<void> {
  // Check if in a group
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }
  
  // In private chat, this command doesn't make sense
  if (ctx.chat.type === "private") {
    await ctx.reply("This command is meant to be used in groups.");
    return;
  }
  
  try {
    // Get chat information
    const chat = await ctx.getChat();
    
    // Get member count
    const memberCount = await ctx.getChatMembersCount();
    
    // Get admin count
    let adminCount = 0;
    try {
      const admins = await ctx.getChatAdministrators();
      adminCount = admins.length;
    } catch (error) {
      console.error("Error getting admin count:", error);
    }
    
    // Build the group info message with improved UI
    let infoText = `
<b>📊 GROUP INFORMATION</b>

<b>📝 Basic Details</b>
• <b>Name:</b> ${chat.title || "Unknown"}
• <b>Type:</b> ${chat.type === "supergroup" ? "Supergroup" : chat.type === "group" ? "Basic Group" : chat.type}
• <b>ID:</b> <code>${chat.id}</code>

<b>👥 Members</b>
• <b>Total:</b> ${memberCount} members
• <b>Admins:</b> ${adminCount} administrators
`;

    if (chat.description) {
      infoText += `
<b>📄 Description</b>
${chat.description}`;
    }
    
    // Add group username if available
    if (chat.username) {
      infoText += `

<b>🌐 Public Link</b>
https://t.me/${chat.username}`;
    }
    
    // Send text-only response with improved formatting
    await ctx.reply(infoText, {
      parse_mode: "HTML"
    });
    
  } catch (error) {
    console.error("Error getting group info:", error);
    await ctx.reply("Failed to get group information.");
  }
} 