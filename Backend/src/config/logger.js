const winston = require("winston");
const path = require("path");
const env = require("./env");

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, stack, requestId }) => {
        const reqTag = requestId ? ` [${requestId}]` : "";
        return `${timestamp} ${level}${reqTag}: ${stack || message}`;
    })
);

const transports = [
    new winston.transports.Console({
        format: env.NODE_ENV === "production" ? logFormat : consoleFormat
    })
];

if (env.NODE_ENV !== "test") {
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, "../../logs/error.log"),
            level: "error",
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join(__dirname, "../../logs/combined.log"),
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );
}

const logger = winston.createLogger({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    format: logFormat,
    transports
});

module.exports = logger;
