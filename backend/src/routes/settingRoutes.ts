import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import {optionalAuth} from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import envTokenAuth from "../middleware/envTokenAuth";
import * as SettingController from "../controllers/SettingController";
import uploadPublicConfig from "../config/uploadPublic";
import uploadPrivateConfig from "../config/privateFiles";

const settingRoutes = Router();

settingRoutes.get("/settings", isAuth, SettingController.index);

settingRoutes.get("/settingsregister", isAuth, isAdmin, SettingController.getSettingRegister);

settingRoutes.get("/public-settings/:settingKey",optionalAuth, SettingController.publicShow);
settingRoutes.get("/public-settings",optionalAuth, SettingController.publicIndex);

// change setting key to key in future
settingRoutes.put("/settings/:settingKey", isAuth, isAdmin, SettingController.update);

const uploadPublic = multer(uploadPublicConfig);
const uploadPrivate = multer(uploadPrivateConfig);

settingRoutes.post(
  "/settings/logo",
  isAuth, isAdmin,
  uploadPublic.single("file"),
  SettingController.storeLogo
);

settingRoutes.post(
  "/settings/privateFile",
  isAuth, isAdmin,
  uploadPrivate.single("file"),
  SettingController.storePrivateFile
)

export default settingRoutes;
