const prisma = require("../config/database");

/**
 * Lightweight process liveness probe.
 * Returns HTTP 200 immediately if the Node.js event loop is responsive.
 */
const getLiveness = (req, res) => {
    return res.status(200).json({
        success: true,
        status: "alive",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
};

/**
 * Deep readiness probe checking PostgreSQL connectivity, database latency, and system memory.
 */
const getReadiness = async (req, res) => {
    let dbStatus = "connected";
    let dbLatencyMs = null;

    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbLatencyMs = Date.now() - start;
    } catch {
        dbStatus = "disconnected";
    }

    const memory = process.memoryUsage();
    const isReady = dbStatus === "connected";

    return res.status(isReady ? 200 : 503).json({
        success: isReady,
        status: isReady ? "ready" : "not_ready",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        database: {
            status: dbStatus,
            latencyMs: dbLatencyMs
        },
        memory: {
            rssMb: Number((memory.rss / (1024 * 1024)).toFixed(2)),
            heapUsedMb: Number((memory.heapUsed / (1024 * 1024)).toFixed(2)),
            heapTotalMb: Number((memory.heapTotal / (1024 * 1024)).toFixed(2))
        }
    });
};

/**
 * Enhanced health check endpoint verifying server uptime and PostgreSQL database probe.
 */
const gethealth = async (req, res) => {
    let dbStatus = "connected";
    let dbLatencyMs = null;

    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbLatencyMs = Date.now() - start;
    } catch {
        dbStatus = "disconnected";
    }

    const memory = process.memoryUsage();
    const isHealthy = dbStatus === "connected";

    return res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status: isHealthy ? "healthy" : "degraded",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatus,
            latencyMs: dbLatencyMs
        },
        memory: {
            rssMb: (memory.rss / (1024 * 1024)).toFixed(2),
            heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(2)
        }
    });
};

module.exports = {
    gethealth,
    getLiveness,
    getReadiness
};