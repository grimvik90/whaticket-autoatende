import express from "express";
import isAuth from "../middleware/isAuth";

import * as GroupController from "../controllers/GroupController";

const groupRoutes = express.Router();

groupRoutes.get("/groups", isAuth, GroupController.index);

export default groupRoutes;
