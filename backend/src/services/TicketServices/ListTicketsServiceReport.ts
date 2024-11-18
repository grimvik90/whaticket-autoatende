/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
import {Op, QueryTypes, Sequelize} from "sequelize";
import * as _ from "lodash";
import sequelize from "../../database";
import TicketTraking from "../../models/TicketTraking";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import User from "../../models/User";
import Queue from "../../models/Queue";
import Reason from "../../models/Reason";
import Contact from "../../models/Contact";

export interface DashboardData {
  tickets: any[];
  totalTickets: any;
}

export interface Params {
  searchParam: string;
  contactId: string;
  whatsappId?: string[];
  dateFrom: string;
  dateTo: string;
  status?: string[];
  queueIds?: number[];
  tags?: number[];
  users?: number[];
  userId: string;
  reasonId?: string;
}

export default async function ListTicketsServiceReport(
  companyId: string | number,
  params: Params,
  page: number = 1,
  pageSize: number = 20
): Promise<DashboardData> {
  const offset = (page - 1) * pageSize;

  // Construção da cláusula WHERE usando Sequelize
  const whereConditions: any = {
    companyId,
    ...(params.dateFrom && {createdAt: {[Op.gte]: new Date(`${params.dateFrom} 00:00:00`)}}),
    ...(params.dateTo && {createdAt: {[Op.lte]: new Date(`${params.dateTo} 23:59:59`)}}),
    ...(params.whatsappId && params.whatsappId.length && {whatsappId: {[Op.in]: params.whatsappId}}),
    ...(params.users && params.users.length && {userId: {[Op.in]: params.users}}),
    ...(params.queueIds && params.queueIds.length && {'$ticket.queueId$': {[Op.in]: params.queueIds}}),
    ...(params.status && params.status.length && {'$ticket.status': {[Op.in]: params.status}}),
    // ...(params.tags && params.tags.length && {tags: {[Op.in]: params.tags}}), //todo: fix tags.
    ...(params.contactId && {'$ticket.contactId$': params.contactId}),
    ...(params.reasonId && { reasonId: params.reasonId }),
  };

  const tickets = await TicketTraking.findAll({
    where: whereConditions,
    include: [
      {
        model: Ticket,
        as: 'ticket',
        required: true,
        attributes: [
          'id',
          'status',
          'lastMessage',
          'uuid',
          'queueId',
          'userId',
          'contactId'
        ],
        include: [
          { model: Contact, as: 'contact', attributes: ['name'] },
          {
            model: Queue,
            as: 'queue',
            attributes: ['name'],
            required: false
          },
        ],
        where: {
          ...(params.queueIds && params.queueIds.length && { queueId: { [Op.in]: params.queueIds } }),
          ...(params.status && params.status.length && { status: { [Op.in]: params.status } }),
          ...(params.contactId && { contactId: params.contactId }),
        }
      },
      { model: Whatsapp, as: 'whatsapp', attributes: ['name'] },
      {
        model: User,
        as: 'user',
        attributes: ['name'],
        required: false
      },
      {
        model: Reason,
        as: 'reason',
        attributes: ['name'],
        required: false
      }
    ],
    order: [['id', 'DESC']],
    limit: pageSize,
    offset
  });

  const totalTickets = await TicketTraking.count({
    where: whereConditions,
    include: [
      {
        model: Ticket,
        as: 'ticket',
        required: true,
        where: {
          ...(params.queueIds && params.queueIds.length && { queueId: { [Op.in]: params.queueIds } }),
          ...(params.status && params.status.length && { status: { [Op.in]: params.status } }),
          ...(params.contactId && { contactId: params.contactId }),
        }
      },
    ],
  });

  return { tickets, totalTickets };
}
