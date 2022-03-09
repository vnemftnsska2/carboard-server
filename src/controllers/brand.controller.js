const mariadb = require("../../database/connect/mariadb");

const getBrandList = (req, res) => {
  console.log("GET Brand List...");
  const ret = mariadb.query(
    "SELECT * FROM product_brand",
    (err, rows, fields) => {
      if (!err) {
        res.send(rows);
      } else {
        console.log("DB ERROR: ", err);
        res.send(err);
      }
    }
  );
};

const addBrand = (req, res) => {
  const newBrand = req.body;
  try {
    mariadb.query(`INSERT INTO product_brand SET ? `, newBrand);
    return res.json({ status: 200, message: "Create Brand" });
  } catch (e) {
    console.log(e);
    return res.json({ status: 500 });
  }
};

module.exports = { getBrandList, addBrand };
