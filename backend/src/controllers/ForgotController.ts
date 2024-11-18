import { v4 as uuid } from "uuid";
import { Request, Response } from "express";
import SendMail from "../services/ForgotPassWordServices/SendMail";
import ResetPassword from "../services/ResetPasswordService/ResetPassword";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.body; // Use req.body para obter o email
  const TokenSenha = uuid();

  const forgotPassword = await SendMail(email, TokenSenha);

  if (!forgotPassword) {
    return res.status(404).json({ error: "E-mail não enviado" });
  }

  return res.json({ message: "E-mail enviado com sucesso" });
};

export const resetPasswords = async (req: Request, res: Response): Promise<Response> => {
  const { email, token, password } = req.body; // Use req.body para obter o token e a nova senha

  const resetPassword = await ResetPassword(email, token, password);

  if (!resetPassword) {
    return res.status(404).json({ error: "Verifique o Token informado" });
  }

  return res.json({ message: "Senha redefinida com sucesso" });
};
