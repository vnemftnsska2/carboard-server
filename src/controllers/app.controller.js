const mariadb = require("../../database/connect/mariadb");
const jwt = require("jsonwebtoken");
const crypto = require("crypto-js");

require("dotenv").config();

function login(req, res) {
  const { userid, password } = req.body;
  console.log(userid, password)
  const users = {
    admin: { userid, title: '관리자', auth: 'manager' },
    editor: { userid, title: '에디터', auth: 'editor' },
    viewer: { userid, title: '뷰어', auth: 'viewer' },
  };

  const passwords = {
    admin: 'qwe123!@#', editor: 'editor123!', viewer: 'viewer123!',
  }

  if (users[userid] && passwords[userid] === password) {
    res.status(200).json(users[userid]);
  } else {
    res.status(401).json({ message: '로그인 정보를 확인해주시기 바랍니다.' })
  }

  /*
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
  */
}

module.exports = { login };
