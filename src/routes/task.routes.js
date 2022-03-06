const TaskRoutes = require("express").Router();
const { getTaskList, addTask } = require("../controllers/task.controller");

//Middleware
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (rq, file, cb) => {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const orgFileName = file.originalname;
    cb(
      null,
      `${orgFileName.slice(0, -4)}_${Date.now()}${path.extname(orgFileName)}`
    );
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".png" || ext !== ".jpg") {
      return cb(res.status(400).end("Only png, jpg Are Allowed"), false);
    }
    cb(null, true);
  },
});

const upload = multer({ storage: storage });

TaskRoutes.route("/tasks/t/:type").get(getTaskList);
TaskRoutes.route("/task").post(upload.single("release_img"), addTask);

module.exports = TaskRoutes;
