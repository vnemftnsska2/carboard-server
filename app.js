const express = require("express");
const mariadb = require("./database/connect/mariadb");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// env
require("dotenv").config();

// FILE
const storage = multer.diskStorage({
  destination: "./upload_files/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploader = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
});

// APP
const app = express();
app.set("port", process.env.PORT || 3030);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Cors
app.use(cors({
  origin: "*",
  credentials: true,
}));

// init test
app.get("/api", (req, res) => {
  res.send("Hello Express");
});

// Login
app.post("/api/login", (req, res) => {
  // 이메일 & 비밀번호 체크
  // 토큰 생성
  // const userToken = jwt.sign({ userid: 'admin' }, process.env.JWT_TOKEN);
  // res.cookie('jwt_auth', userToken, {
  //     maxAge: 1000 * 60 * 60 * 24 * 7,
  //     httpOnly: true,
  // });
  // res.send(JSON.stringify({status: 200}))
});

app.get("/api/tasks/t/:type", (req, res) => {
  console.log("GET Task List...");
  const selectType = parseInt(req.params.type);
  mariadb.query(
    `SELECT
        idx,
        status,
        DATE_FORMAT(delivery_date, '%Y-%m-%d') as delivery_date,
        manager,
        car_master,
        car_type,
        customer_name,
        customer_phone,
        car_front,
        car_side_a,
        car_side_b,
        car_back,
        panorama,
        blackbox,
        ppf,
        etc,
        coil_matt,
        glass_film,
        tinting,
        DATE_FORMAT(release_date, '%Y-%m-%dT%T') as release_date,
        release_doc,
        payment_type,
        payment_amount,
        payment_completed,
        ROW_NUMBER() OVER() as rowno
        FROM ${process.env.DB_NAME}.task
        WHERE 1 = 1
          AND ${selectType > 0 ? `status = ${selectType}` : `status < 5`}
        ORDER BY field(status,3,2,1,4), delivery_date DESC`,
    (err, rows, fields) => {
      if (!err) {
        // console.log(rows)
        res.send(rows);
      } else {
        console.log("query error : " + err);
        res.send(err);
      }
    }
  );
});

app.get("/api/leading/:id", (req, res) => {
  mariadb.query(
    `SELECT
        idx,
        status,
        DATE_FORMAT(delivery_date, '%Y-%m-%d') as delivery_date,
        manager,
        car_master,
        car_type,
        customer_name,
        customer_phone,
        car_front,
        car_side_a,
        car_side_b,
        car_back,
        panorama,
        blackbox,
        ppf,
        etc,
        coil_matt,
        glass_film,
        tinting,
        DATE_FORMAT(release_date, '%Y-%m-%d') as release_date,
        release_doc,
        payment_type,
        payment_completed,
        ROW_NUMBER() OVER() as rowno
      FROM ${process.env.DB_NAME}.task
      WHERE id = ${req.params.id}
      LIMIT 1`,
    (err, rows, fields) => {
      if (!err) {
        res.send(rows);
      } else {
        console.log("query error : ", err);
        res.send(err);
      }
    }
  );
});

app.post("/api/task", (req, res) => {
  console.log("ADD TASK PARAM:", req.body);
  const param = req.body;
  if (!param.delivery_date) param.delivery_date = null;
  if (!param.release_date) param.release_date = null;
  try {
    const query = `INSERT INTO ${process.env.DB_NAME}.task SET ? `;
    mariadb.query(query, param, (err, rows, fields) => {
      if (!err) {
        console.log("INSERT SUCCESS");
        res.send(JSON.stringify({ status: 200 }));
      } else {
        console.log(err);
        res.send(JSON.stringify({ status: 500 }));
      }
    });
  } catch (e) {
    console.log(e);
    res.send(JSON.stringify({ status: 500 }));
  }
});

app.post("/api/task/:id", (req, res) => {
  const param = req.body;
  if (!param.delivery_date) param.delivery_date = null;
  if (!param.release_date) param.release_date = null;

  const setColumnsQuery = [];
  for (let column in param) {
    if (column !== "idx") {
      const value =
        param[column] === null ? param[column] : `"${param[column]}"`;
      setColumnsQuery.push(`${column} = ${value}`);
    }
  }
  setColumnsQuery.push(`updated_at = NOW()`);

  try {
    const addQuery = `${setColumnsQuery.join(", \n")} where idx = ${param.idx}`;
    const query = `UPDATE ${process.env.DB_NAME}.task SET ${addQuery}`;
    mariadb.query(query, param, (err, rows, fields) => {
      if (!err) {
        console.log("UPDATE SUCCESS");
        res.send(JSON.stringify({ status: 200 }));
      } else {
        console.log(err);
        res.send(JSON.stringify({ status: 500 }));
      }
    });
  } catch (e) {
    console.log(e);
    res.send(JSON.stringify({ status: 500 }));
  }
});

app.delete("/api/task/:id", (req, res) => {
  const taskId = req.params.id;
  console.log(`DELETE TASK:: ${taskId}`);

  try {
    const query = `DELETE FROM ${process.env.DB_NAME}.task
            WHERE idx=${req.params.id}`;
    mariadb.query(query, (err, rows, fields) => {
      if (!err) {
        console.log("DELETE SUCCESS");
        res.send(JSON.stringify({ status: 200 }));
      } else {
        console.log(err);
        res.send(JSON.stringify({ status: 500 }));
      }
    });
  } catch (e) {
    console.log(e);
    res.send(JSON.stringify({ status: 500 }));
  }
});

app.post("/api/leading/finish/:id", (req, res) => {
  const stockId = req.params.id;
  console.log(`FINISH LEADING:: ${stockId}`);
  const { name, type, bigo } = req.body;
  const finishDate = type === "G" ? req.body.goal_at : req.body.loss_at;

  try {
    const query = `UPDATE ${process.env.DB_NAME}.leading
            SET ${type === "G" ? "goal_at" : "loss_at"} = "${moment(
      finishDate
    ).format("YYYY-MM-DD")}"
            WHERE id=${req.params.id}`;
    mariadb.query(query, (err, rows, fields) => {
      if (!err) {
        console.log("DELETE SUCCESS");
        res.send(JSON.stringify({ status: 200 }));
      } else {
        console.log(err);
        res.send(JSON.stringify({ status: 500 }));
      }
    });
  } catch (e) {
    console.log(e);
    res.send(JSON.stringify({ status: 500 }));
  }
});


app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중...");
});
