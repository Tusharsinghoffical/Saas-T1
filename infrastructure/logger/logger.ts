export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogPayload {
  event: string;
  [key: string]: any;
}

function writeLog(level: LogLevel, payload: LogPayload | string, meta?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const entry =
    typeof payload === "string"
      ? { timestamp, level, event: payload, ...meta }
      : { timestamp, level, ...payload, ...meta };

  const serialized = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    process.stderr.write(serialized + "\n");
  } else {
    process.stdout.write(serialized + "\n");
  }
}

export const logger = {
  debug: (payload: LogPayload | string, meta?: Record<string, any>) => writeLog("debug", payload, meta),
  info: (payload: LogPayload | string, meta?: Record<string, any>) => writeLog("info", payload, meta),
  warn: (payload: LogPayload | string, meta?: Record<string, any>) => writeLog("warn", payload, meta),
  error: (payload: LogPayload | string, meta?: Record<string, any>) => writeLog("error", payload, meta),
};
