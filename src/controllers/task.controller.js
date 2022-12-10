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
        ORDER BY field(status, 3, 2, 1, 4), delivery_date DESC`,
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
  console.log('addTask:', param)
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
          console.log("INSERT SUCCESS!?!?!?!?");
          res.status(200).json({ message: '작업지시서가 등록되었습니다.'});
        } else {
          console.log(err);
          const { code, sqlMessage } = err;
          res.status(500).json({ code, message: sqlMessage });
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
  if (!param.delivery_date || param.delivery_date === "null") param.delivery_date = null;
  if (!param.release_date || param.release_date === "null") param.release_date = null;
  if (req.file) param.release_img = req.file.filename;

  //Setting Parameter
  const setValues = [];
  const setQuestionColumns = [];
  Object.entries(param).forEach(([column, value]) => {
    if (!['idx', 'rowno'].includes(column)) {
      setValues.push(value);
      setQuestionColumns.push(`${column} = ?`);
    }
  });

  // setColumnsQuery.push(`updated_at = NOW()`);
  try {
    console.log('updateTask', setQuestionColumns.length, setValues.length);
    const query = [];
    query.push(`UPDATE ${process.env.DB_NAME}.task`);
    query.push(`SET`);
    query.push(setQuestionColumns.join(", "));
    query.push(`WHERE idx = ?`);
    setValues.push(param.idx);
    console.log('query: ', query.join(' '));
    console.log('setValues: ', setValues);
    mariadb.query(query.join(' '), setValues, (err, rows, fields) => {
      if (!err) {
        res.status(200).json({ message: `NO. ${param.idx} 수정이 완료되었습니다.`});
      } else {
        const { code, sqlMessage } = err;
        res.status(500).json({ code, message: sqlMessage });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: '작업지시서 수정 중 문제가 발생하였습니다.' });
  }
}

function deleteTask(req, res) {
  const taskId = req.params.id;
  console.log(`*** DELETE TASK:: ${ taskId }`);
  try {
    const query = `DELETE FROM ${process.env.DB_NAME}.task WHERE idx= ?`;
    mariadb.query(query, [ taskId ],  (err, rows, fields) => {
      if (!err) {
        console.log("DELETE SUCCESS");
        res.status(200).json({ message: `NO.${taskId} 작업지시서가 삭제되었습니다.`});
      } else {
        const { code, sqlMessage } = err;
        res.status(500).json({ code, message: sqlMessage });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ code: 'Server Exception', message: 'ERROR...' })
  }
}

function deleteTaskImg(req, res) {
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
        const { code, sqlMessage } = err;
        res.status(500).json({ code, message: sqlMessage });
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
