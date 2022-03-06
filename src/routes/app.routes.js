const AppRoutes = require("express").Router();
const { login } = require("../controllers/app.controller");

AppRoutes.route("/login").post(login);

module.exports = AppRoutes;
