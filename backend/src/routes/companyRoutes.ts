import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";

import * as CompanyController from "../controllers/CompanyController";

const companyRoutes = express.Router();

companyRoutes.get("/companies/list", isAuth, isSuper, CompanyController.list);
companyRoutes.get("/companies", isAuth, isSuper, CompanyController.index);
companyRoutes.get("/companies/:id", isAuth, CompanyController.show);
companyRoutes.post("/companies", isAuth, isSuper, CompanyController.store);
companyRoutes.put("/companies/:id", isAuth, isSuper, CompanyController.update);
companyRoutes.put("/companies/:id/schedules",isAuth,CompanyController.updateSchedules);
companyRoutes.delete("/companies/:id", isAuth, isSuper, CompanyController.remove);
companyRoutes.post("/companies/cadastro", CompanyController.signup);

companyRoutes.get("/companies/total", isAuth, isSuper, CompanyController.total);

// Rota para listar o plano da empresa
companyRoutes.get("/companies/listPlan/:id", isAuth, CompanyController.listPlan);
companyRoutes.get("/companiesPlan", isAuth, CompanyController.indexPlan);

//companyRoutes.get('/companySettings/:companyId', isAuth, CompanyController.getAllSettings);
//companyRoutes.get('/companySettings/setting/:id', isAuth, CompanyController.getSetting);
//companyRoutes.put('/companySettings/:id', isAuth, CompanyController.updateSetting);



export default companyRoutes;
