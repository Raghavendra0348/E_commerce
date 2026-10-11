const prisma = require("../config/database");

const getProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true,
                images: true
            }
        });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts
};