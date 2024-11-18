import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import Ticket from "../models/Ticket";
import UpdateTicketNameService from "../services/TicketServices/UpdateTicketNameService";
import CreateTicketService from "../services/TicketServices/CreateTicketService";
import DeleteTicketService from "../services/TicketServices/DeleteTicketService";
import ListTicketsServiceDash from "../services/TicketServices/ListTicketsServiceDash";
import ListTicketsService from "../services/TicketServices/ListTicketsService";
import CreateGroupService from "../services/GroupServices/CreateGroupService";
import ShowTicketUUIDService from "../services/TicketServices/ShowTicketFromUUIDService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import UpdateTicketValueService from "../services/TicketServices/UpdateTicketValueService";
import ListTicketsServiceKanban from "../services/TicketServices/ListTicketsServiceKanban";
import ListTicketsServiceReport from "../services/TicketServices/ListTicketsServiceReport";
import { Mutex } from "async-mutex";
import AppError from "../errors/AppError";
import User from "../models/User";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  status: string;
  date: string;
  updatedAt?: string;
  showAll: string;
  //chatbot?: boolean | string;
  withUnreadMessages: string;
  queueIds: string;
  tags: string;
  users: string;
  dateFrom: string;
  dateUntil: string;
  reasonId?: string;
};

interface TicketData {
  contactId: number;
  status: string;
  queueId: number;
  userId: number;
  whatsappId: string;
  useIntegration: boolean;
  promptId: number;
  integrationId: number;
  sendFarewellMessage?: boolean;
  value?: number;
  sku?: string;
}

interface CreateTicketGroupData {
  contactsAddGroup: string[];
  status: string;
  queueId: number;
  userId: number;
  whatsappId?: string;
  justClose: boolean;
  sendFarewellMessage?: boolean;
  titleGroup: string;
}

type IndexQueryReport = {
  searchParam: string;
  contactId: string;
  whatsappId: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  queueIds: string;
  tags: string;
  users: string;
  page: string;
  pageSize: string;
  reasonId: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
	const {
    pageNumber,
    status,
    date,
    updatedAt,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    withUnreadMessages,
    reasonId
  } = req.query as IndexQuery;

  const userId = req.user.id;
  const { companyId } = req.user;

  let queueIds: number[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  if (userIdsStringified) {
    usersIds = JSON.parse(userIdsStringified);
  }

  // Adicione startDate e endDate com valores apropriados
  const startDate = req.query.startDate; // Supondo que startDate é passado como parte do query
  const endDate = req.query.endDate; // Supondo que endDate é passado como parte do query

  const { tickets, count, hasMore } = await ListTicketsService({
    searchParam,
    tags: tagsIds,
    users: usersIds,
    pageNumber,
    status,
    date,
    updatedAt,
    showAll,
    userId,
    queueIds,
    withUnreadMessages,
    companyId,
    reasonId: reasonId as string,
    startDate: startDate as string, // Corrigido
    endDate: endDate as string, // Corrigido
  });
  return res.status(200).json({ tickets, count, hasMore });
};

export const report = async (req: Request, res: Response): Promise<Response> => {
  const {
    searchParam,
    contactId,
    whatsappId: whatsappIdsStringified,
    dateFrom,
    dateTo,
    status: statusStringified,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    page: pageNumber,
    reasonId,
    pageSize
  } = req.query as IndexQueryReport;

  const userId = req.user.id;
  const { companyId } = req.user;

  let queueIds: number[] = [];
  let whatsappIds: string[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];
  let statusIds: string[] = [];


  if (statusStringified) {
    statusIds = JSON.parse(statusStringified);
  }

  if (whatsappIdsStringified) {
    whatsappIds = JSON.parse(whatsappIdsStringified);
  }

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  if (userIdsStringified) {
    usersIds = JSON.parse(userIdsStringified);
  }

  const { tickets, totalTickets } = await ListTicketsServiceReport(
    companyId,
    {
      searchParam,
      queueIds,
      tags: tagsIds,
      users: usersIds,
      status: statusIds,
      dateFrom,
      dateTo,
      userId,
      contactId,
      reasonId,
      whatsappId: whatsappIds
    },
    +pageNumber,
    +pageSize
  );

  return res.status(200).json({ tickets, totalTickets });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { contactId, status, userId, queueId, whatsappId, value, sku }: TicketData = req.body;
  const { companyId, id } = req.user;

  const ticketCount = await Ticket.count({ where: { userId: id, status: "open", companyId } });
  const { limitAttendance, name } = await User.findByPk(id);


  if (ticketCount >= limitAttendance) {
   // throw new AppError(`Número máximo de atendimentos atingido para o usuario ${name}, encerre um atendimento para criar um novo.`, 400);
  }

  const ticket = await CreateTicketService({
    contactId,
    status,
    userId,
    companyId,
    queueId,
    whatsappId: whatsappId?.toString(),
    value: value,
    sku: sku
  });

  const io = getIO();
  io.to(`company-${ticket.companyId}-${ticket.status}`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .emit(`company-${companyId}-ticket`, {
    action: "update",
    ticket
  });
  return res.status(200).json(ticket);
};

export const kanban = async (req: Request, res: Response): Promise<Response> => {
  const {
    pageNumber,
    status,
    date,
    updatedAt,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    withUnreadMessages
  } = req.query as IndexQuery;


  const userId = req.user.id;
  const { companyId } = req.user;

  let queueIds: number[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  if (userIdsStringified) {
    usersIds = JSON.parse(userIdsStringified);
  }

  const { tickets, count, hasMore, tagValues } = await ListTicketsServiceKanban({
    searchParam,
    tags: tagsIds,
    users: usersIds,
    pageNumber,
    status,
    date,
    updatedAt,
    showAll,
    userId,
    queueIds,
    withUnreadMessages,
    companyId
  });

  return res.status(200).json({ tickets, count, hasMore, tagValues });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  const contact = await ShowTicketService(ticketId, companyId);
  return res.status(200).json(contact);
};


export const storeGroupAndTicket = async (req: Request, res: Response): Promise<Response> => {
  const { contactsAddGroup, status, userId, queueId, whatsappId, titleGroup }: CreateTicketGroupData = req.body;
  const { companyId } = req.user;

  try {
    const createdGroup = await CreateGroupService({ contactsAddGroup, whatsappId, titleGroup, companyId });

    if (createdGroup.id) {
      console.log('343Entrei')
      const contactId = createdGroup.id;

      const ticket = await CreateTicketService({
        contactId,
        status,
        userId,
        companyId,
        queueId,
        whatsappId
      });

      console.log(ticket.isGroup)

      const io = getIO();
      io.to(`company-${companyId}-${ticket.status}`)
        .to(`queue-${ticket.queueId}-${ticket.status}`)
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket
        });

      return res.status(200).json(ticket);
    }

  } catch (error) {
    // Trate o erro de forma apropriada aqui
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  // Se o fluxo não entrar no bloco "if" ou lançar uma exceção, ainda assim retorne uma resposta HTTP 200
  return res.status(200).send();
}



export const updateTicketName = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { name } = req.body;
  const { companyId } = req.user;

  try {
    const ticket = await UpdateTicketNameService({
      ticketId,
      name,
      companyId,
    });

    return res.status(200).json(ticket);
  } catch (error) {
    console.error("Erro ao atualizar o nome do ticket:", error);
    return res.status(500).send("Erro interno do servidor");
  }
};

export const showFromUUID = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { uuid } = req.params;

  const ticket: Ticket = await ShowTicketUUIDService(uuid);

  return res.status(200).json(ticket);
};

export const closeAll = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  var status = req.body.status as string;

  var ticketList = await Ticket.findAll({
    where: {
      companyId: companyId,
      status: status
    }
  });

  try {
    await Promise.all(ticketList.map(ticket =>
      UpdateTicketService({
        ticketData: {
          status: "closed",
          userId: ticket.userId || null,
          queueId: ticket.queueId || null,
          unreadMessages: 0,
          amountUsedBotQueues: 0,
          sendFarewellMessage: false,
        },
        ticketId: ticket.id,
        companyId: companyId
      })
    ));
    return res.status(200).json({ message: "all tickets closed" });
  } catch (error) {
    console.error("Erro ao fechar tickets:", error);
    return res.status(500).send("Erro interno do servidor");
  }
};

export const updateValue = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const ticketData: TicketData = req.body;
  const { companyId, id } = req.user;

  console.log("value: %s", ticketData.value);
  console.log("sku: %s", ticketData.sku);

  // Validate ticketId and value
  if (!ticketId || isNaN(Number(ticketId))) {
    return res.status(400).json({ message: "Invalid ticket ID provided." });
  }

  if (ticketData.value === undefined) {
    return res.status(400).json({ message: "Value is required." });
  }
  if (ticketData.sku === undefined) {
    return res.status(400).json({ message: "SKU is required." });
  }

  let ticket;

  try {
    // Update the ticket data in the database
    console.log("value: %s", ticketData.value);
    console.log("sku: %s", ticketData.sku);
    ticket = await Ticket.update(
      { value: Number(ticketData.value), sku: ticketData.sku },
      { where: { id: Number(ticketId), companyId } }
    );

    ticket = ticket[0]; // Updated ticket object

    console.log("salvei value: %s", ticket.value);
    console.log("salvei sku: %s", ticket.sku);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found." });
    }

  } catch (error) {
    console.error("Erro ao atualizar o ticket:", error);
    return res.status(500).send("Erro interno do servidor");
  }

  return res.status(200).json(ticket);
};

export const dash = async (req: Request, res: Response): Promise<Response> => {
  const {
    pageNumber,
    status,
    date,
    updatedAt,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    withUnreadMessages
  } = req.query as IndexQuery;

  const userId = req.user.id;
  const { companyId } = req.user;

  let queueIds: number[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  if (userIdsStringified) {
    usersIds = JSON.parse(userIdsStringified);
  }

  const { tickets, count, hasMore } = await ListTicketsServiceDash({
    searchParam,
    tags: tagsIds,
    users: usersIds,
    pageNumber,
    status,
    date,
    updatedAt,
    showAll,
    userId,
    queueIds,
    withUnreadMessages,
    companyId
  });

  //console.log("ticket controller 82");

  return res.status(200).json({ tickets, count, hasMore });
};


export const update = async (
    req: Request,
    res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const ticketData: TicketData = req.body;
  const { companyId, id } = req.user;

  const mutex = new Mutex();
  const { ticket } = await mutex.runExclusive(async () => {
    return await UpdateTicketService({
      ticketData,
      ticketId,
      companyId,
      tokenData: req.tokenData,
    });
  });

  return res.status(200).json(ticket);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  await ShowTicketService(ticketId, companyId);

  const ticket = await DeleteTicketService(ticketId);

  const io = getIO();
  io
    .to(`company-${companyId}-${ticket.status}`)
    .to(ticketId)
    .to(`queue-${ticket.queueId}-notification`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(`company-${ticket.companyId}-notification`)
    .emit(`company-${companyId}-ticket`, {
      action: "delete",
      ticketId: +ticketId
    });

  return res.status(200).json({ message: "ticket deleted" });
};
export const kbu = async (req: Request, res: Response): Promise<Response> => {
  const { queueIds: queueIdsStringified } = req.query as IndexQuery;
  //console.log(req.query);
  const queueIds: number[] = queueIdsStringified
    ? JSON.parse(queueIdsStringified)
    : [];

  return res.status(200).json({ message: "teste" });
};
