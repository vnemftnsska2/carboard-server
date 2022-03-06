const FileRouter = require("express").Router();
const { getImage } = require("../controllers/file.controller");

FileRouter.route("/image/:filename").get(getImage);

module.exports = FileRouter;
