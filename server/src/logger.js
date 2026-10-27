// ============================================================
// One logger for the whole server (slide 12: logs to a file).
// Every log line goes to logs/app.log, and errors also go to
// logs/error.log so they are easy to find.
// ============================================================
import path from "node:path";
import winston from "winston";

const LOG_DIR = process.env.LOG_DIR || "logs";

export const logger = winston.createLogger({
  level: "info",
  // Tests should not fill the log file with fake requests.
  silent: process.env.NODE_ENV === "test",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(LOG_DIR, "app.log") }),
    new winston.transports.File({ filename: path.join(LOG_DIR, "error.log"), level: "error" }),
  ],
});
