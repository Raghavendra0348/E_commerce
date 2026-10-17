const addressService = require("../services/address.service");
const { success } = require("../utils/response.utils");

const getAddresses = async (req, res, next) => {
    try {
        const addresses = await addressService.getAddresses(req.user.userId);
        return success(res, 200, "Addresses fetched successfully", addresses);
    } catch (error) { next(error); }
};

const createAddress = async (req, res, next) => {
    try {
        const address = await addressService.createAddress(req.user.userId, req.body);
        return success(res, 201, "Address created successfully", address);
    } catch (error) { next(error); }
};

const updateAddress = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const address = await addressService.updateAddress(req.user.userId, id, req.body);
        return success(res, 200, "Address updated successfully", address);
    } catch (error) { next(error); }
};

const deleteAddress = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        await addressService.deleteAddress(req.user.userId, id);
        return success(res, 200, "Address deleted successfully");
    } catch (error) { next(error); }
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };
