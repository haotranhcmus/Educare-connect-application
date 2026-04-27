/**
 * Lightweight debug logger for EduCare Connect
 *
 * In development: logs to console with timestamps and color prefixes.
 * In production:  all logs are silenced automatically.
 *
 * Usage:
 *   import { logger } from "@/src/utils/logger";
 *   logger.api("fetchSessionDetail", "start", { sessionId });
 *   logger.api("fetchSessionDetail", "error", error);
 */

const IS_DEV = __DEV__;

type Level = "api" | "session" | "eval" | "nav" | "auth" | "warn" | "error";

const PREFIX: Record<Level, string> = {
  api: "🌐 [API]",
  session: "📋 [SESSION]",
  eval: "📊 [EVAL]",
  nav: "🔀 [NAV]",
  auth: "🔑 [AUTH]",
  warn: "⚠️  [WARN]",
  error: "❌ [ERROR]",
};

function timestamp(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function log(level: Level, tag: string, msg: string, data?: unknown): void {
  if (!IS_DEV) return;
  const line = `${timestamp()} ${PREFIX[level]} ${tag} — ${msg}`;
  if (level === "error") {
    console.error(line, data !== undefined ? data : "");
  } else if (level === "warn") {
    console.warn(line, data !== undefined ? data : "");
  } else {
    console.log(line, data !== undefined ? data : "");
  }
}

export const logger = {
  api: (tag: string, msg: string, data?: unknown) => log("api", tag, msg, data),
  session: (tag: string, msg: string, data?: unknown) =>
    log("session", tag, msg, data),
  eval: (tag: string, msg: string, data?: unknown) =>
    log("eval", tag, msg, data),
  nav: (tag: string, msg: string, data?: unknown) => log("nav", tag, msg, data),
  auth: (tag: string, msg: string, data?: unknown) =>
    log("auth", tag, msg, data),
  warn: (tag: string, msg: string, data?: unknown) =>
    log("warn", tag, msg, data),
  error: (tag: string, msg: string, data?: unknown) =>
    log("error", tag, msg, data),
};
