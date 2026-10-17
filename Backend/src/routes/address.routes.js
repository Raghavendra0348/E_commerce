const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createAddressSchema, updateAddressSchema, addressIdSchema } = require("../validators/address.validator");

router.use(authenticate);

router.get("/", addressController.getAddresses);
router.post("/", validate(createAddressSchema), addressController.createAddress);
router.put("/:id", validate(updateAddressSchema), addressController.updateAddress);
router.delete("/:id", validate(addressIdSchema), addressController.deleteAddress);

module.exports = router;
