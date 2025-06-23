/**
 * Format a time ago string from a date
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  } else {
    return `${diffSecs} second${diffSecs !== 1 ? "s" : ""}`;
  }
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Parse a duration string like "1h30m" into milliseconds
 */
export function parseDuration(durationStr: string): number | null {
  // Regex to match patterns like 1d, 2h, 30m, 45s
  const regex = /(\d+)([dhms])/g;
  let match: RegExpExecArray | null;
  let totalMs = 0;
  let matched = false;
  
  while ((match = regex.exec(durationStr)) !== null) {
    matched = true;
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case "d":
        totalMs += value * 24 * 60 * 60 * 1000; // days to ms
        break;
      case "h":
        totalMs += value * 60 * 60 * 1000; // hours to ms
        break;
      case "m":
        totalMs += value * 60 * 1000; // minutes to ms
        break;
      case "s":
        totalMs += value * 1000; // seconds to ms
        break;
    }
  }
  
  return matched ? totalMs : null;
}

/**
 * Format a duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  const parts: string[] = [];
  
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);
  
  return parts.join(", ");
} 