import { BotContext } from "../../types";
import { extractUserAndReason } from "../../utils/commandUtils";
import { isAdmin } from "../../middleware/adminMiddleware";
import { Warning } from "../../db/Warning";

export async function userinfoCommand(ctx: BotContext): Promise<void> {
  if (!ctx.chat) {
    await ctx.reply("Could not identify chat.");
    return;
  }
  
  // Extract target user
  const { targetUser } = await extractUserAndReason(ctx);
  
  // If no target user specified, use the command sender
  const user = targetUser || ctx.from;
  
  if (!user) {
    await ctx.reply("Could not identify user.");
    return;
  }
  
  try {
    // Get user information
    let chatMember;
    let isUserAdmin = false;
    
    // Only try to get chat member info if in a group
    if (ctx.chat.type !== "private") {
      try {
        chatMember = await ctx.getChatMember(user.id);
        isUserAdmin = ["administrator", "creator"].includes(chatMember.status);
      } catch (error) {
        console.error("Error getting chat member:", error);
      }
    }
    
    // Get user profile photos
    let photoCount = 0;
    try {
      const photos = await ctx.api.getUserProfilePhotos(user.id, { limit: 1 });
      photoCount = photos.total_count;
    } catch (error) {
      console.error("Error getting profile photos:", error);
    }
    
    // Build the user info message
    let infoText = `
<b>👤 User Information</b>

<b>Name:</b> ${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}
<b>Username:</b> ${user.username ? `@${user.username}` : "None"}
<b>ID:</b> ${user.id}
<b>Profile Photos:</b> ${photoCount}
`;

    // Add chat-specific information if in a group
    if (ctx.chat.type !== "private" && chatMember) {
      infoText += `
<b>Status in this chat:</b> ${chatMember.status}
<b>Is Admin:</b> ${isUserAdmin ? "Yes" : "No"}
`;
    }
    
    // Fetch warning count from DB
    let warningCount = 0;
    if (ctx.chat.type !== "private") {
      const warning = await Warning.findOne({ userId: user.id, chatId: ctx.chat.id });
      warningCount = warning ? warning.count : 0;
      infoText += `<b>Warnings:</b> ${warningCount}/3\n`;
    }
    
    // Send the info message
    let photoFileId = "";
    if (photoCount > 0) {
      try {
        const photos = await ctx.api.getUserProfilePhotos(user.id, { limit: 1 });
        if (photos.photos.length > 0) {
          photoFileId = photos.photos[0][0].file_id;
        }
      } catch (error) {
        console.error("Error getting user photo:", error);
      }
    }
    
    // Try to send with photo, fallback to text if it fails
    if (photoFileId) {
      try {
        await ctx.replyWithPhoto(photoFileId, {
          caption: infoText,
          parse_mode: "HTML"
        });
      } catch (photoError) {
        console.error("Error sending photo, falling back to text:", photoError);
        await ctx.reply(infoText, {
          parse_mode: "HTML"
        });
      }
    } else {
      await ctx.reply(infoText, {
        parse_mode: "HTML"
      });
    }
    
  } catch (error) {
    console.error("Error getting user info:", error);
    await ctx.reply("Failed to get user information.");
  }
} 