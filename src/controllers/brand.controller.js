const mariadb = require("../../database/connect/mariadb");

const getBrandList = async (req, res) => {
  const ret = await mariadb.query("SELECT * FROM product_brand");
  return res.json(ret[0]);
};

const findOneBrand = async (req, res) => {
  const ret = await mariadb.query("SELECT * FROM product_brand");
  return res.json(ret[0]);
};

const addBrand = async (req, res) => {
  const newBrand = req.body;
  const conn = await connect();
  await mariadb.query("INSERT INTO product_brand SET ?", [newTask]);
  return res.json({
    message: "Create Brand",
  });
};

module.exports = { getBrandList, findOneBrand, addBrand };
