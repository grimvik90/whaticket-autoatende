import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import User from "../models/User";
import Setting from "../models/Setting";

type HeaderParams = {
  Bearer: string;
};

const tokenAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization.replace("Bearer ", "");
  
      if (!token) {
        return next();
      }
  
      const setting = await Setting.findOne({
        where: {
          key: "apiToken",
          value: token
        }
      });
  
      if (!setting) {
        return next();
      }
  
      const user = await User.findOne({
        where: {
          profile: "admin",
          companyId: setting.companyId
        }
      });
  
      if (user) {
        req.user = {
          id: `${user.id}`,
          profile: user.profile,
          isSuper: user.super ? true : false,
          companyId: setting.companyId
        };
      }
  
      return next();
    } catch (e) {
      console.log(e);
    }
  
    throw new AppError("Token inválido", 403);
  };

export default tokenAuth;
