import mariadb from "../../database/connect/mariadb";

export const getTask = async (req, res) => {
  const ret = await mariadb.query("SELECT * FROM task");
  return res.json(ret[0]);
};

export const addTask = async (req, res) => {
  const newTask = req.body;
  const conn = await connect();
  await mariadb.query("INSERT INTO task SET ?", [newTask]);
  return res.json({
    message: "Create Task",
  });
};
