import {Request, Response, NextFunction} from "express";
import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import User from "../models/User";
import Setting from "../models/Setting";

const isAuthApi = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('Authorization header is missing');
      return res.status(401).json({error: 'Authorization header is required'});
    }

    let token = authHeader;

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Log do token recebido
    console.log(`Token recebido: ${token}`);

    // Verifica se o token existe na tabela Whatsapp
    const whatsapp = await Whatsapp.findOne({
      attributes: ['token', 'companyId'], // Especifica os campos que você deseja retornar
      where: {token}
    });

    if (!whatsapp) {
      console.log(`Token de conexao inválido.`);

      const setting = await Setting.findOne({
        where: {
          key: "apiToken",
          value: token
        }
      });

      console.log("apiTOken is:" + setting.value);

      if(!setting) {
        return res.status(401).json({ status: 'ERRO', error: 'Token de autorização inválido' });
      }
      return res.status(401).json({status: 'ERRO', error: 'Token de autorização inválido'});
    }

    const user = await User.findOne({
      where: {
        profile: "admin",
        companyId: whatsapp.companyId
      }
    });

    if (user) {
      req.user = {
        id: `${user.id}`,
        profile: user.profile,
        isSuper: user.super ? true : false,
        companyId: whatsapp.companyId
      };
    }

    return next();
  } catch (e) {
    console.log(e);
    throw new AppError(e.toString(), 403);
  }
};

export default isAuthApi;
