const mariadb = require("../../database/connect/mariadb");

function getTaskList(req, res) {
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
        FROM task
        WHERE 1 = 1
          AND ${selectType > 0 ? `status = ${selectType}` : `status < 5`}
        ORDER BY field(status,3,2,1,4), delivery_date DESC`,
    (err, rows, fields) => {
      if (!err) {
        res.send(rows);
      } else {
        console.log("query error : ", err);
        res.send(err);
      }
    }
  );
}

function addTask(req, res) {
  const param = req.body;
  if (!param.delivery_date) param.delivery_date = null;
  if (!param.release_date) param.release_date = null;
  if (req.file) param.release_img = req.file.filename;

  try {
    const query = `INSERT INTO ${process.env.DB_NAME}.task SET ? `;
    mariadb.query(
      query,
      JSON.parse(JSON.stringify(param)),
      (err, rows, fields) => {
        if (!err) {
          console.log("INSERT SUCCESS");
          res.send(JSON.stringify({ status: 200 }));
        } else {
          console.log(err);
          res.send(JSON.stringify({ status: 500 }));
        }
      }
    );
  } catch (e) {
    console.log(e);
    res.send(JSON.stringify({ status: 500 }));
  }
}

function updateTask(req, res) {
  const param = JSON.parse(JSON.stringify(req.body));
  if (!param.delivery_date || param.delivery_date === "null")
    param.delivery_date = null;
  if (!param.release_date || param.release_date === "null")
    param.release_date = null;
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
}

function deleteTask(res, req) {
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
}

function deleteTaskImg(res, req) {
  console.log("Delete Image");
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
}

module.exports = {
  getTaskList,
  addTask,
  updateTask,
  deleteTask,
  deleteTaskImg,
};
