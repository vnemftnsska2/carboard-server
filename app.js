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

app.get("/api/tasks", (req, res) => {
  console.log("GET TASK LIST");
  mariadb.query(
    `SELECT * FROM ${process.env.DB_NAME}.task ORDER BY created_at DESC`,
    (err, rows, fields) => {
      if (!err) {
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
    `
        SELECT
            *
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
  console.log("ADD LEADING", req.body);
  const {
    deliveryDate,
    manager,
    carMaster,
    carType,
    customerName,
    customerPhone,
    carFront,
    carSideA,
    carSideB,
    carBack,
    panorama,
    blackBox,
    ppf,
    etc,
    coil,
    glassFilm,
    tinting,
    releaseDate,
    releaseDoc,
    paymentType,
    paymentCompleted,
  } = req.body;

  try {
    const insertParam = {
      manager: manager,
      car_master: carMaster,
      car_type: carType,
      customer_name: customerName,
      customer_phone: customerPhone,
      car_front: carFront,
      car_side_a: carSideA,
      car_side_b: carSideB,
      car_back: carBack,
      panorama: panorama,
      blackbox: blackBox,
      ppf: ppf,
      etc: etc,
      coil_matt: coil,
      glass_film: glassFilm,
      tinting: tinting,
      release_doc: releaseDoc,
      payment_type: paymentType,
      payment_completed: paymentCompleted,
    };

    if (deliveryDate) {
      insertParam.delivery_date = deliveryDate;
    }

    if (releaseDate) {
      insertParam.release_date = releaseDate;
    }

    const query = `INSERT INTO ${process.env.DB_NAME}.task SET ? `;
    console.log("PARAM:", insertParam);
    mariadb.query(query, insertParam, (err, rows, fields) => {
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

app.post("/api/leading/:id", (req, res) => {
  console.log("UPDATE LEADING");
  const {
    code,
    name,
    type,
    strategy,
    first_price,
    second_price,
    third_price,
    goal_price,
    loss_price,
    lead_at,
    bigo,
  } = req.body;
  // const lead_at = moment(req.body.lead_at).format('YYYY-MM-DD');
  // console.log('req: ', req.body);
  try {
    const query = `UPDATE ${process.env.DB_NAME}.leading
        SET 
            code="${code}",
            name="${name}",
            type="${type}",
            strategy="${strategy}",
            first_price=${first_price},
            second_price=${second_price},
            third_price=${third_price},
            goal_price="${goal_price}",
            loss_price=${loss_price},
            lead_at="${moment(lead_at).format("YYYY-MM-DD")}",
            bigo="${bigo}",
            updated_at="${moment().format("YYYY-MM-DD")}"
        WHERE id=${req.params.id}`;
    mariadb.query(query, (err, rows, fields) => {
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

app.post("/api/leading/delete/:id", (req, res) => {
  const stockId = req.params.id;
  console.log(`DELETE LEADING:: ${stockId}`);

  try {
    const query = `DELETE FROM ${process.env.DB_NAME}.leading
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

// Init
app.use(cors({ origin: "http://localhost:3000" }));
app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중...");
});
