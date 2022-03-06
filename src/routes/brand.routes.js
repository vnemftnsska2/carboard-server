const express = require("express");
const router = express.Router();

import { getTask } from "../controllers/barnd.controller";

router.route("/brand").get(getTask);

export default router;
