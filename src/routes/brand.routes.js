const BrandRouter = require("express").Router();
const { getBrandList, addBrand } = require("../controllers/brand.controller");

BrandRouter.route("/brand").get(getBrandList);
BrandRouter.route("/brand/:id").get(getBrandList);
BrandRouter.route("/brand").post(addBrand);

module.exports = BrandRouter;
