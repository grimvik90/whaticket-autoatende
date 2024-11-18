// controllers/ApiController/Invoices.ts
import { Request, Response, NextFunction } from "express";
import * as Yup from 'yup';
import Invoices from "../../models/Invoices";
import Whatsapp from "../../models/Whatsapp";
import Company from "../../models/Company";
import ShowInvoiceService from "../../services/InvoicesService/ShowInvoiceService";
import ListInvoicesServices from "../../services/InvoicesService/ListInvoicesServices";
import UpdateInvoiceService from "../../services/InvoicesService/UpdateInvoiceService";
import { InvoicesSchema, InvoicesData, InvoicesQuery } from "../../validators/api/InvoicesValidators";
import AppError from "../../errors/AppError";


// Listar todas as invoices
export const listAllInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await InvoicesSchema.validate(req.query);
    const authHeader = req.headers.authorization;
    const [, token] = authHeader.split(" ");
    const whatsapp = await Whatsapp.findOne({ where: { token } });
    const companyId = whatsapp.companyId;
    const { searchParam, pageNumber } = req.query as InvoicesQuery;

    if (companyId === 1)
    {
      const { invoices, count, hasMore } = await ListInvoicesServices({
        searchParam,
        pageNumber
      });
      return res.json({ invoices, count, hasMore });
    } else {
      return res.status(401).json({ status: 'ERRO', error: 'Acesso não autorizado. Por favor, forneça credenciais válidas.' });
    }
  } catch (error) {
    next(error);
  }
};

// Mostrar uma invoice
export const showOneInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await InvoicesSchema.validate(req.params);
    const authHeader = req.headers.authorization;
    const [, token] = authHeader.split(" ");
    const whatsapp = await Whatsapp.findOne({ where: { token } });
    const companyId = whatsapp.companyId;
    const { Invoiceid } = req.params;
    const invoice = await ShowInvoiceService(Invoiceid);
    return res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
};

// Listar invoices por empresa
export const showAllInvoicesByCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await InvoicesSchema.validate(req.body);
    try {
      const authHeader = req.headers.authorization;
      const [, token] = authHeader.split(" ");
      const whatsapp = await Whatsapp.findOne({ where: { token } });
      const compKey = whatsapp.companyId;

      // Extrair id e status do corpo da solicitação
      const { companyId, status } = req.body;

      // Filtrar os invoices pelo companyId e status
      if (compKey === 1){
        const invoices = await Invoices.findAll({
          where: {
            companyId,
            status
          }
        });

        return res.status(200).json(invoices);
      } else{
        return res.status(401).json({ status: 'ERRO', error: 'Acesso não autorizado. Por favor, forneça credenciais válidas.' });
      }

    } catch (error) {
      console.error("Erro ao buscar invoices:", error);
      return res.status(500).json({ error: "Erro ao buscar invoices" });
    }
  } catch (error) {
    next(error);
  }
};

// Atualizar uma invoice
export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await InvoicesSchema.validate(req.body);
    const authHeader = req.headers.authorization;
    const [, token] = authHeader.split(" ");
    const whatsapp = await Whatsapp.findOne({ where: { token } });
    const compKey = whatsapp.companyId;
    const InvoiceData: InvoicesData = req.body;
    const schema = Yup.object().shape({ name: Yup.string() });
    try {
      await schema.validate(InvoiceData);
    } catch (err) {
      throw new AppError(err.message);
    }
    const { id, status } = InvoiceData;

    if (compKey === 1){
      const plan = await UpdateInvoiceService({ id, status });


        const invoices = await Invoices.findByPk(id);
        const companyId = invoices.companyId;
        const company = await Company.findByPk(companyId);
        const expiresAt = new Date(company.dueDate);
        expiresAt.setDate(expiresAt.getDate() + 30);
        const date = expiresAt.toISOString().split("T")[0];
        if (company) {
          await company.update({ dueDate: date });
          const invoi = await invoices.update({
            id: id,
            status: "paid"
          });
          await company.reload();
          const companyUpdate = await Company.findOne({
            where: { id: companyId }
          });

        }
      return res.status(200).json(plan);
    } else{
      return res.status(401).json({ status: 'ERRO', error: 'Acesso não autorizado. Por favor, forneça credenciais válidas.' });
    }
  } catch (error) {
    next(error);
  }
};


