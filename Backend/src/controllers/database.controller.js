const prisma = require("../config/database");

const checkDatabase = async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            message: "Database connection is working"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkDatabase
};