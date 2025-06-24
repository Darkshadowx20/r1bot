# Reporting System Documentation

The Telegram Group Management Bot includes a comprehensive reporting system that allows users to report problematic messages or users to group administrators.

## Features

- Users can report messages or users to admins
- Reports are tracked and stored in a database
- Admins are notified about new reports through a log channel or group notification
- Reports can be viewed and managed through commands

## User Commands

### `/report` - Report a user or message

Users can report problematic content or users in several ways:

1. **Reply to a message**: Reply to the problematic message with `/report [reason]`
2. **Mention a user**: Use `/report @username [reason]` or include a mention in your report
3. **Text mention**: Use a text mention (clickable username) in your report

The reason is optional but recommended to provide context for administrators.

Example:
```
/report Posting spam links
/report @username Harassing other users
```

## Admin Commands

### `/reports` - View pending reports

Administrators can view all pending reports for the group with this command. The command displays:

- Report ID
- Reported user
- Reporter
- Reason for the report
- Timestamp
- Link to the reported message (if available)

### `/resolve` - Resolve a report

After handling a report, admins can mark it as resolved using:

1. **By report ID**: `/resolve [report_id]` (partial IDs are supported)
2. **By username**: `/resolve @username` (resolves the most recent report for that user)

Example:
```
/resolve 60a7c8b1e3d4f2a1b3c5d7e9
/resolve 60a7c8
/resolve @problematicuser
```

When resolving by username, the bot will:
- Search for all pending reports for users with that username
- If multiple reports are found, resolve the most recent one
- Provide feedback about which report was resolved

### `/setreportchannel` - Set up a log channel for reports

To send all reports to a dedicated channel:

1. Create a channel
2. Add the bot as an administrator to the channel
3. Get the channel ID (you can use @username_to_id_bot or similar)
4. Run `/setreportchannel [channel_id]`

Example:
```
/setreportchannel -1001234567890
```

## How It Works

1. When a user submits a report, it's stored in the database
2. The bot notifies admins through:
   - A dedicated log channel (if configured)
   - A notification in the group (if no log channel is configured)
3. Admins can view reports with `/reports` and take appropriate action
4. After handling the situation, admins can mark the report as resolved

## Best Practices

1. **Configure a log channel**: Setting up a dedicated log channel is strongly recommended to keep report details private
2. **Regular review**: Check `/reports` regularly to handle issues promptly
3. **Clear instructions**: Inform users about the reporting system and when to use it
4. **Follow up**: After resolving reports, consider informing the reporter that action was taken

## Troubleshooting

- **Can't set up log channel**: Ensure the bot is an admin in the channel with posting permissions
- **Report command not working**: Make sure to reply to a message or mention a user correctly
- **Username not found**: The bot can only find users who are admins or who have recently sent messages
- **Resolve command not working**: Try using the full report ID from the `/reports` command 