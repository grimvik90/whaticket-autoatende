import { Request, Response, NextFunction } from "express";
import Whatsapp from "../../models/Whatsapp";
import Queue from '../../models/Queue';
import User from '../../models/User';
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";
import ShowTicketService from "../../services/TicketServices/ShowTicketService";
import UpdateTicketService from "../../services/TicketServices/UpdateTicketService";
import ListTicketsService from "../../services/TicketServices/ListTicketsService";
import Tag from "../../models/Tag";
import Contact from "../../models/Contact";
import Company from "../../models/Company";

// Atualizar a fila de um ticket
export const updateQueueId = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { queueId } = req.body;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const whatsapp = await Whatsapp.findOne({ where: { token } });
  const companyId = whatsapp.companyId;

  try {
    // Verifique se a fila pertence à empresa especificada
    const isQueueValidForCompany = await Queue.findOne({
      where: { id: queueId, companyId: companyId },
    });

    if (!isQueueValidForCompany) {
      return res.status(400).json({ status: "ERROR", error: "Invalid queue for the company" });
    }

    // Chame o serviço UpdateTicketService aqui, passando o ticketId e o novo queueId
    await UpdateTicketService({
      ticketId: Number(ticketId), // Certifique-se de converter para número, se necessário
      ticketData: { queueId },
      companyId: companyId, // Substitua isso pela lógica real para obter companyId a partir do token
    });

    return res.status(200).json({ status: "SUCCESS" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "ERROR", error: "Internal Server Error" });
  }
};

// Fechar um ticket
export const closeTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const whatsapp = await Whatsapp.findOne({ where: { token } });
  const companyId = whatsapp.companyId;
  const { ticketId } = req.params;
  const ticketData = await ShowTicketService(Number(ticketId), companyId);
  ticketData.status = req.body.ticketData.status;
  console.log(ticketData.status);
  const { ticket } = await UpdateTicketService({
    ticketData: ticketData as any, // Ajuste o tipo conforme necessário
    ticketId: Number(ticketId),
    companyId
  });
  return res.status(200).json(ticket);
};

// Atualizar tags de um ticket
export const updateTicketTag = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId, tagId } = req.body;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");

  try {
    // Busque o companyId associado ao token
    const whatsapp = await Whatsapp.findOne({ where: { token } });
    const companyId = whatsapp.companyId;

    // Verifique se a tag pertence à empresa especificada
    const tag = await Tag.findOne({
      where: { id: tagId, companyId: companyId },
    });

    if (!tag) {
      return res.status(400).json({ status: "ERROR", error: "Tag does not belong to the specified company" });
    }

    // Verifique se a tag já está associada ao ticket
    const existingTag = await TicketTag.findOne({
      where: { ticketId, tagId },
    });

    if (existingTag) {
      return res.status(400).json({ status: "ERROR", error: "Tag already associated with the ticket" });
    }

    // Adicione a nova tag ao ticket
    const ticketTag = await TicketTag.create({ ticketId, tagId });

    return res.status(200).json({ status: "SUCCESS", ticketTag });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "ERROR", error: "Failed to update ticket tag" });
  }
};

// Remover tags de um ticket
export const removeTicketTag = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId, tagId } = req.body;

  try {
    // Verifique se a tag está associada ao ticket
    const ticketTag = await TicketTag.findOne({
      where: { ticketId, tagId },
    });

    if (!ticketTag) {
      return res.status(400).json({ status: "ERROR", error: "Tag is not associated with the ticket" });
    }

    // Remova a associação entre a tag e o ticket
    await ticketTag.destroy();

    return res.status(200).json({ status: "SUCCESS" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "ERROR", error: "Failed to remove ticket tag" });
  }
};

// Listar tickets por empresa
export const listTicketsByCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { searchParam, pageNumber, status, date, updatedAt, showAll, withUnreadMessages } = req.query;
    const { companyId, id: userId } = req.user;

    const queueIds = req.query.queueIds ? JSON.parse(req.query.queueIds as string) : [];
    const tags = req.query.tags ? JSON.parse(req.query.tags as string) : [];
    const users = req.query.users ? JSON.parse(req.query.users as string) : [];
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const { tickets, count, hasMore } = await ListTicketsService({
      searchParam: searchParam as string,
      pageNumber: pageNumber as string,
      companyId,
      startDate,
      endDate,
      userId,
      queueIds,
      status: status as string,
      date: date as string,
      updatedAt: updatedAt as string,
      showAll: showAll as string,
      withUnreadMessages: withUnreadMessages as string,
      tags,
      users
    });

    return res.status(200).json({ tickets, count, hasMore });
  } catch (error) {
    next(error);
  }
};

// Listar tickets por tag
export const listTicketsByTag = async (req: Request, res: Response): Promise<Response> => {
  const { tagId } = req.params;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");

  try {
    // Busque o companyId associado ao token
    const whatsapp = await Whatsapp.findOne({ where: { token } });
    const companyId = whatsapp.companyId;

    // Verifique se a tag pertence à empresa especificada
    const tag = await Tag.findOne({
      where: { id: tagId, companyId: companyId },
    });

    if (!tag) {
      return res.status(400).json({ status: "ERROR", error: "Tag does not belong to the specified company" });
    }

    // Busque todos os tickets relacionados à tag específica, à empresa e à tagId
    const tickets = await Ticket.findAll({
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "name"],
          through: {
            attributes: [],
            where: { tagId: tagId }
          }
        },
        {
          model: Contact,
          as: "contact",
          attributes: [
            "id",
            "name",
            "number",
            "email",
            "profilePicUrl",
            "acceptAudioMessage",
            "active",
            "disableBot"
          ],
          include: ["extraInfo"]
        },
        { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
        { model: User, as: "user", attributes: ["id", "name"] },
        {
          model: Whatsapp,
          as: "whatsapp",
          attributes: ["name", "facebookUserToken", "facebookUserId"]
        },
        { model: Company, as: "company", attributes: ["name"] }
      ],
      where: {
        companyId: companyId,  // Adicionando condição para filtrar pela empresa correta
        '$tags.id$': tagId  // Adicionando condição para filtrar pela tagId correta
      }
    });

    return res.status(200).json({ status: "SUCCESS", tickets });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "ERROR", error: "Internal Server Error" });
  }
};
