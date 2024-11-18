import express from "express";
import * as ForgotController from "../controllers/ForgotController";

const forgotsRoutes = express.Router();

// Rota para solicitar redefinição de senha
forgotsRoutes.post("forgetpassword/:email", ForgotController.store);

// Rota para redefinir a senha
forgotsRoutes.post("resetpassword", ForgotController.resetPasswords);

export default forgotsRoutes;
