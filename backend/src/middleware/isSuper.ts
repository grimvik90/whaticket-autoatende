import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import User from "../models/User";

const isSuper = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    throw new AppError("Usuário não autenticado", 401);
  }

  const { super: isSuperUser } = await User.findByPk(req.user.id);
  if (!isSuperUser) {
    throw new AppError("Acesso não permitido", 401);
  }

  return next();
}

export default isSuper;
