const express = require("express");
const mariadb = require("./database/connect/mariadb");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

//MiddleWare
const { checkAuth } = require("./middleware/auth");

// env
require("dotenv").config();

// APP
const app = express();
app.set("port", process.env.PORT || 3030);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('uploads', express.static('uploads'))

// Cors
app.use(cors({
  origin: "*",
  credentials: true,
}));

// FILE
const storage = multer.diskStorage({
  destination: (rq, file, cb) => {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const orgFileName = file.originalname;
    cb(null, `${orgFileName.slice(0, -4)}_${Date.now()}${path.extname(orgFileName)}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if(ext !== '.png' || ext !== '.jpg'){
        return cb(res.status(400).end('Only png, jpg Are Allowed'), false);
    } 
    cb(null, true);
  }
});

const upload = multer({ storage: storage, });

// init test
app.get("/api", (req, res) => {
  res.send("Hello Express");
});

// Login
app.post("/api/login", (req, res) => {
  const {
    user_id: userid,
    password
  } = req.body;

  mariadb.query(`SELECT count(*) AS CNT
    FROM ${process.env.DB_NAME}.employee
    WHERE 1 = 1
    AND userid = '${userid}'
    AND password = '${password}'
    LIMIT 1`, (err, rows, fields) => {
      if (rows[0].CNT === 1) {
        const userToken = jwt.sign({ userid: req.userid }, process.env.SECRET_ACCESS_TOKEN);
        res.cookie('jwt_auth', userToken, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
        });
        res.send(JSON.stringify({status: 200}))
      } else if (rows[0].CNT === 0) {
        res.send(JSON.stringify({status: 401}))
      }
  });
});

app.get("/image/:filename", checkAuth, (req, res) => {
  const filename = req.params.filename;
  fs.readFile(`uploads/${filename}`, (err, rows) => {
    if (!err) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(rows);
    }
  });
});

app.get("/api/tasks/t/:type", checkAuth, (req, res) => {
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
        release_img,
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

app.get("/api/leading/:id", checkAuth, (req, res) => {
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
        release_img,
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

//ADD
app.post("/api/task", checkAuth, upload.single('release_img'), (req, res) => {
  const param = req.body;
  if (!param.delivery_date) param.delivery_date = null;
  if (!param.release_date) param.release_date = null;
  if (req.file) param.release_img = req.file.filename;

  try {
    const query = `INSERT INTO ${process.env.DB_NAME}.task SET ? `;
    mariadb.query(query, JSON.parse(JSON.stringify(param)), (err, rows, fields) => {
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

//UPDATE
app.post("/api/task/:id", checkAuth, upload.single('release_img'), (req, res) => {
  const param = JSON.parse(JSON.stringify(req.body));
  
  if (!param.delivery_date || param.delivery_date === 'null') param.delivery_date = null;
  if (!param.release_date || param.release_date === 'null') param.release_date = null;
  if (req.file) param.release_img = req.file.filename;
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

//DELETE
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

app.delete("/api/task/image/:id", (req, res) => {
  console.log('Delete Image');
  try {
    const query = `UPDATE ${process.env.DB_NAME}.task
            SET release_img = ''
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

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중...");
});
