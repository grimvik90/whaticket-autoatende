import * as Yup from "yup";
import { Request, Response } from "express";
import AppError from "../errors/AppError";
import Company from "../models/Company";
import jwtConfig from "../config/auth";
import ListCompaniesService from "../services/CompanyService/ListCompaniesService";
import CreateCompanyService from "../services/CompanyService/CreateCompanyService";
import UpdateCompanyService from "../services/CompanyService/UpdateCompanyService";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import UpdateSchedulesService from "../services/CompanyService/UpdateSchedulesService";
import DeleteCompanyService from "../services/CompanyService/DeleteCompanyService";
import FindAllCompaniesService from "../services/CompanyService/FindAllCompaniesService";
import CountAllCompanyService from "../services/CompanyService/CountAllCompanyService";
import { verify } from "jsonwebtoken";
import User from "../models/User";
import ShowPlanCompanyService from "../services/CompanyService/ShowPlanCompanyService";
import ListCompaniesPlanService from "../services/CompanyService/ListCompaniesPlanService";
import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import ListSettingsServiceOne from "../services/SettingServices/ListSettingsServiceOne";
import { CheckSettings } from "../helpers/CheckSettings";
import moment from "moment";
import fs from "fs";  // Importa o módulo fs para operações sincrônicas
import fsPromises from "fs/promises";  // Importa o módulo fs/promises para operações assíncronas
import path from "path";

const publicFolder = path.resolve(__dirname, "..", "..", "public");

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  companyId: number;
  iat: number;
  exp: number;
}

type CompanyData = {
  name: string;
  id?: number;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: any;
  recurrence?: string;
};

type SchedulesData = {
  schedules: [];
};

interface SettingsRequest {
  isSuper: boolean,
  companyId: number;
}

const calculateDirectoryMetrics = async (companyId: number) => {
  const folderPath = path.join(publicFolder, `company${companyId}`);

  try {
    // Verifica se o diretório existe
    if (!fs.existsSync(folderPath)) {
      console.warn(`Directory does not exist: ${folderPath}`);
      return {
        folderSize: 0,
        numberOfFiles: 0,
        lastUpdated: null,
      };
    }

    const files = await fsPromises.readdir(folderPath);
    let totalSize = 0;
    let numberOfFiles = files.length;
    let lastUpdated = new Date(0); // Data inicial

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fsPromises.stat(filePath);
      totalSize += stats.size;
      if (stats.mtime > lastUpdated) {
        lastUpdated = stats.mtime;
      }
    }

    return {
      folderSize: totalSize,
      numberOfFiles,
      lastUpdated,
    };
  } catch (error) {
    console.error(`Error calculating directory metrics for company ${companyId}:`, error);
    return {
      folderSize: 0,
      numberOfFiles: 0,
      lastUpdated: null,
    };
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { companies, count, hasMore } = await ListCompaniesService({
    searchParam,
    pageNumber
  });

  return res.json({ companies, count, hasMore });
};

export const signup = async (req: Request, res: Response): Promise<Response> => {
  if (await CheckSettings("allowSignup", "enabled") !== "enabled") {
    return res.status(401).json("🙎🏻‍♂️ Signup disabled");
  }
  return await store(req, res);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const newCompany: CompanyData = req.body;

  try {
    const trialDays = await CheckSettings('trialExpiration', 10);
    const totalDays = parseInt(trialDays, 10);

    if (isNaN(totalDays) || totalDays <= 0) {
      newCompany.dueDate = moment().add(7, 'days').toDate();
    } else {
      newCompany.dueDate = moment().add(totalDays, 'days').toDate();
    }

    const company = await CreateCompanyService(newCompany);
    return res.status(201).json(company);
  } catch (error) {
    console.trace(error);
    return res.status(500).json({ message: 'Error creating company', error });
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const requestUser = await User.findByPk(req.user.id);
  if (!requestUser.super && Number.parseInt(id, 10) !== requestUser.companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const company = await ShowCompanyService(id);

  return res.status(200).json(company);
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const companies: Company[] = await FindAllCompaniesService();

  return res.status(200).json(companies);
};

export const total = async (req: Request, res: Response): Promise<Response> => {
  const companies = await CountAllCompanyService();
  return res.status(200).json(companies);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const companyData: CompanyData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    email: Yup.string().email().nullable(),
    phone: Yup.string().nullable(),
    status: Yup.boolean().nullable(),
    planId: Yup.number().nullable(),
    campaignsEnabled: Yup.boolean().nullable(),
    dueDate: Yup.date().nullable(),
    recurrence: Yup.string().nullable()
  });

  try {
    await schema.validate(companyData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const company = await UpdateCompanyService({ id, ...companyData });

  return res.status(200).json(company);
};

export const updateSchedules = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { schedules }: SchedulesData = req.body;
  const { id } = req.params;

  const requestUser = await User.findByPk(req.user.id);
  if (!requestUser.super && Number.parseInt(id, 10) !== requestUser.companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const company = await UpdateSchedulesService({
    id,
    schedules
  });

  return res.status(200).json(company);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const folderPath = path.join(publicFolder, `company${id}`);
  if (fs.existsSync(folderPath)) {
    fs.rmdirSync(folderPath, { recursive: true });
  }
  const company = await DeleteCompanyService(id);

  return res.status(200).json(company);
};

export const listPlan = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, jwtConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === true || companyId.toString() === id) {
    const company = await ShowPlanCompanyService(id);
    return res.status(200).json(company);
  } else {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  }
};

export const indexPlan = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, jwtConfig.secret);
  const { id, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(id);

  if (requestUser.super === true) {
    const companies = await ListCompaniesPlanService();

    // Calcular métricas para cada empresa
    const companiesWithMetrics = await Promise.all(companies.map(async (company) => {
      const metrics = await calculateDirectoryMetrics(company.id);
      console.log(`folderSize: {metrics.folderSize}`);
      console.log(`numberOfFiles: {metrics.numberOfFiles}`);
      console.log(`lastUpdated: {metrics.lastUpdated}`);
      return {
        ...company.toJSON(),  // Converte a instância para um objeto simples
        metrics,
      };
    }));

    return res.status(200).json({ companies: companiesWithMetrics });
  } else {
    const companies = await ListCompaniesPlanService();

    // Calcular métricas para cada empresa
    const companiesWithMetrics = await Promise.all(companies.map(async (company) => {
      const metrics = await calculateDirectoryMetrics(company.id);
      return {
        ...company.toJSON(),  // Converte a instância para um objeto simples
        metrics,
      };
    }));

    return res.status(200).json({ companies: companiesWithMetrics });
  }
};
