const express = require("express");
const { lookupPincode } = require("../services/location.service");
const { success } = require("../utils/response.utils");

const router = express.Router();
router.get("/pincode/:pincode", async (req, res, next) => {
    try {
        const location = await lookupPincode(req.params.pincode);
        return success(res, 200, "PIN code verified", location);
    } catch (error) { next(error); }
});
module.exports = router;
