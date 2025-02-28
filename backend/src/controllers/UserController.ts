import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";

import { CheckSettings } from "../helpers/CheckSettings";
import AppError from "../errors/AppError";

import CreateUserService from "../services/UserServices/CreateUserService";
import ListUsersService from "../services/UserServices/ListUsersService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import ShowUserService from "../services/UserServices/ShowUserService";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import SimpleListService from "../services/UserServices/SimpleListService";
import User from "../models/User";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type ListQueryParams = {
  companyId: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;

  const { users, onlineCount, offlineCount, count, hasMore } = await ListUsersService({
    searchParam,
    pageNumber,
    companyId,
    profile
  });

  return res.json({ users, onlineCount, offlineCount, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    email,
    password,
    name,
    profile,
    isTricked,
    super: userSuper,
    companyId: bodyCompanyId,
    queueIds,
    allTicket,
    whatsappId,
    startWork,
    endWork,
    profileState,
    defaultMenu,
  } = req.body;
  let userCompanyId: number | null = null;

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
  }

  if (req.body.companyId && req.user.companyId !== req.body.companyId) {
    throw new AppError("O usuário não pertence à esta empresa");
  }

  if(!req.user.isSuper && userSuper) {
    throw new AppError("Acesso negado.");
  }

  if (
    req.url === "/signup" &&
    (await CheckSettings("userCreation", "enabled")) === "disabled"
  ) {
    throw new AppError("ERR_USER_CREATION_DISABLED", 403);
  } else if (req.url !== "/signup" && req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }



  const user = await CreateUserService({
    email,
    password,
    name,
    profile,
    isTricked,
    super: userSuper,
    companyId: bodyCompanyId || userCompanyId,
    queueIds,
    allTicket,
    whatsappId,
    startWork,
    endWork,
    defaultMenu,
  });

  const io = getIO();
  io.emit(`company-${userCompanyId}-user`, {
    action: "create",
    user
  });

  return res.status(200).json(user);
};

export const storeFromCompanySettings = async (req: Request, res: Response): Promise<Response> => {
  const {
    email,
    password,
    name,
    profile,
    isTricked,
    super: userSuper,
    companyId: bodyCompanyId,
    queueIds,
    allTicket,
    whatsappId,
    startWork,
    endWork,
    profileState,
    defaultMenu
  } = req.body;
  let userCompanyId: number | null = null;

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
  }

  if (req.body.companyId && req.user.companyId !== req.body.companyId) {
    throw new AppError("O usuário não pertence à esta empresa");
  }

  if(!req.user.isSuper && userSuper) {
    throw new AppError("Acesso negado.");
  }

  if (
    req.url === "/signup" &&
    (await CheckSettings("userCreation","enabled")) === "disabled"
  ) {
    throw new AppError("ERR_USER_CREATION_DISABLED", 403);
  } else if (req.url !== "/signup" && req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const user = await CreateUserService({
    email,
    password,
    name,
    profile,
    isTricked,
    super: userSuper,
    companyId: bodyCompanyId || userCompanyId,
    queueIds,
    allTicket,
    whatsappId,
    startWork,
    endWork,
    defaultMenu,
  });

  const io = getIO();
  io
    .to(`company-${userCompanyId}-mainchannel`)
    .emit(`company-${userCompanyId}-user`, {
    action: "create",
    user
  });

  return res.status(200).json(user);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const user = await ShowUserService(userId, req.user.id);

  return res.status(200).json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {

  const { id: requestUserId, companyId } = req.user;
  const { userId } = req.params;
  const userData = req.body;

  const user = await UpdateUserService({
    userData,
    userId,
    requestUserId: +requestUserId
  });

  const io = getIO();
  io
    .to(`company-${companyId}-mainchannel`)
    .emit(`company-${companyId}-user`, {
    action: "update",
    user
  });

  return res.status(200).json(user);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

await DeleteUserService(userId, req.user.id);

  const io = getIO();
  io
    .to(`company-${companyId}-mainchannel`)
    .emit(`company-${companyId}-user`, {
    action: "delete",
    userId
  });

  return res.status(200).json({ message: "User deleted" });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
  const { companyId: userCompanyId } = req.user;

  const users = await SimpleListService({
    companyId: companyId ? +companyId : userCompanyId
  });

  return res.status(200).json(users);
};
