import { Request, Response, NextFunction } from "express";
import Whatsapp from "../models/Whatsapp";
import AppError from "../errors/AppError";

const tokenAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const whatsapp = await Whatsapp.findOne({ where: { token } });
      if (whatsapp) {
        req.params = {
          whatsappId: whatsapp.id.toString()
        }
      } else {
        throw new Error();
      }
    } catch (err) {
      throw new AppError(
        "Acesso não permitido",
        401
      );
    }
  
    return next();
  };
  
  export default tokenAuth;