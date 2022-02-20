import { Router } from "express";
const router = Router();

import { login } from "../controllers/app.controller";

router.route("/login").post(login);

export default AppRoutes;
