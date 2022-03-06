const mariadb = require("../../database/connect/mariadb");
const jwt = require("jsonwebtoken");
const crypto = require("crypto-js");

require("dotenv").config();

function login(req, res) {
  const { user_id: userid, password } = req.body;
  mariadb.query(
    `SELECT count(*) AS CNT
    FROM ${process.env.DB_NAME}.employee
    WHERE 1 = 1
    AND userid = '${userid}'
    AND password = '${crypto.AES.decrypt(
      password,
      process.env.SECRET_ACCESS_TOKEN
    ).toString(crypto.enc.Utf8)}'
    LIMIT 1`,
    (err, rows, fields) => {
      if (rows[0].CNT === 1) {
        const userToken = jwt.sign(
          { userid: req.userid },
          process.env.SECRET_ACCESS_TOKEN
        );
        res.cookie("jwt_auth", userToken, {
          maxAge: 1000 * 60 * 60 * 24 * 7,
          httpOnly: true,
        });
        res.send(JSON.stringify({ status: 200 }));
      } else if (rows[0].CNT === 0) {
        res.send(JSON.stringify({ status: 401 }));
      }
    }
  );
}

module.exports = { login };
