const prisma = require("../config/database");

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
    gethealth
};