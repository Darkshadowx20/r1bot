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
    
    // Get chat photo if available
    let photoUrl = "";
    if (chat.photo?.big_file_id) {
      try {
        const photoFile = await ctx.api.getFile(chat.photo.big_file_id);
        if (photoFile.file_path) {
          photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${photoFile.file_path}`;
        }
      } catch (error) {
        console.error("Error getting chat photo:", error);
      }
    }
    
    // Format creation date if available
    let creationDate = "Unknown";
    // if (chat.type === "supergroup" && chat.date) {
    //   creationDate = new Date(chat.date * 1000).toLocaleDateString();
    // }
    
    // Build the group info message
    let infoText = `
<b>ℹ️ Group Information</b>

<b>Name:</b> ${chat.title || "Unknown"}
<b>Type:</b> ${chat.type}
<b>ID:</b> ${chat.id}
<b>Members:</b> ${memberCount}
<b>Created:</b> ${creationDate}
`;

    if (chat.description) {
      infoText += `\n<b>Description:</b> ${chat.description}`;
    }
    
    if (chat.invite_link) {
      infoText += `\n<b>Invite Link:</b> ${chat.invite_link}`;
    }
    
    // Send the info message
    if (photoUrl) {
      await ctx.replyWithPhoto(photoUrl, {
        caption: infoText,
        parse_mode: "HTML"
      });
    } else {
      await ctx.reply(infoText, {
        parse_mode: "HTML"
      });
    }
    
  } catch (error) {
    console.error("Error getting group info:", error);
    await ctx.reply("Failed to get group information.");
  }
} 