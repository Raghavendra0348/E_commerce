require("dotenv").config();

const env = require("./config/env");
const logger = require("./config/logger");
const prisma = require("./config/database");
const app = require("./app");

const port = env.PORT || 5000;

const server = app.listen(port, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${port} [http://localhost:${port}]`);
    logger.info(`Health check probe active at http://localhost:${port}/api/health`);
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
    logger.warn(`Received ${signal}. Initiating graceful shutdown...`);

    server.close(async () => {
        logger.info("HTTP server closed.");
        try {
            await prisma.$disconnect();
            logger.info("Database connection closed cleanly.");
            process.exit(0);
        } catch (error) {
            logger.error("Error during database disconnection: %o", error);
            process.exit(1);
        }
    });

    setTimeout(() => {
        logger.error("Forceful shutdown: connections did not close within 10 seconds.");
        process.exit(1);
    }, 10000).unref();
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection: %o", reason);
});

process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception: %o", error);
    process.exit(1);
});
