const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

const getAddresses = async (userId) => {
    return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
};

const createAddress = async (userId, data) => {
    return prisma.address.create({ data: { ...data, userId } });
};

const updateAddress = async (userId, id, data) => {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw ApiError.notFound("Address not found");
    return prisma.address.update({ where: { id }, data });
};

const deleteAddress = async (userId, id) => {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw ApiError.notFound("Address not found");
    await prisma.address.delete({ where: { id } });
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };
