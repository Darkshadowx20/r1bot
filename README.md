# Telegram Group Management Bot

A powerful moderation and management bot built with [grammY](https://grammy.dev) and TypeScript, designed to keep your Telegram group safe, organized, and engaging.

## Features

### Core Moderation Features

- **/ban** – Ban a user from the group.
- **/kick** – Kick and unban a user (can rejoin).
- **/mute [duration]** – Temporarily mute a user (e.g. `/mute 10m`).
- **/unmute** – Remove mute from a user.
- **/warn** – Give a warning to a user.
- **/unwarn** – Remove one or all warnings.
- **/warns** – Check a user's warning count.
- **Slowmode** – Limit how often users can send messages.
- **/cleanup [n]** – Delete the last `n` messages quickly.
- **Admin-Only Commands** – Only admins can run sensitive commands.

### Anti-Spam & Security Features

- **Flood Control** – Auto-warn or mute spammy users.
- **Link Blocking** – Auto-delete messages containing links.
- **Invite Link Blocking** – Auto-delete Telegram group invites.
- **Media Filter** – Block specific media types (GIFs, stickers, etc.).
- **Custom Word Filter** – Delete messages with blacklisted words.
- **Language Filter** – Block messages in certain scripts (e.g. Cyrillic).
- **Verification System** – Captcha for new users before they can chat.
- **Raid Detection** – Detect and mitigate mass-join attacks.

### User & Group Interaction Features

- **Welcome Messages** – Custom welcome text with buttons or rules.
- **Goodbye Messages** – Optional farewell messages when users leave.
- **Auto-Delete Join/Leave Messages** – Clean up automatically.
- **/rules** – Display the group's rules.
- **/setrules** – Admins can set or edit group rules.
- **/pin** – Pin messages with the bot.
- **Auto-Delete Pin Notification** – Remove system message after pin.

### Optional & Fun Features

- **/afk** – Set AFK status, bot auto-replies when you're mentioned.
- **/back** – Mark yourself as back.
- **/rep @user** – Give reputation points to users.
- **Reputation Leaderboard** – View top users by rep.
- **/poll** – Quickly create a Telegram poll.
- **/remindme** – Set personal reminders (e.g. `/remindme 10m Take break`).

## Tech Stack

- **Language:** TypeScript
- **Bot Framework:** [grammY](https://grammy.dev)
- **Package Manager:** pnpm
- **Database:** MongoDB with Mongoose

## Installation

1. Clone this repository
2. Install dependencies with pnpm:
   ```
   pnpm install
   ```
3. Copy `.env.example` to `.env` and fill in your bot token and other settings:
   ```
   cp .env.example .env
   ```
4. Build the project:
   ```
   pnpm build
   ```
5. Start the bot:
   ```
   pnpm start
   ```

## Development

To run the bot in development mode with hot reloading:

```
pnpm dev
```

## Project Structure

```
src/
├── commands/           # Bot commands
│   ├── admin/          # Admin commands
│   ├── moderation/     # Moderation commands
│   ├── user/           # User commands
│   └── fun/            # Optional fun commands
├── middleware/         # Bot middleware
├── services/           # Business logic and services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── db/                 # Database models and connection
└── index.ts            # Entry point
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 