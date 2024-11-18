import { Op } from "sequelize";
import AppError from "../errors/AppError";
import Ticket from "../models/Ticket";

const CheckContactOpenTickets = async (contactId: number,companyId: number, whatsappId?: string): Promise<Ticket | null> => {
  let ticket;

  if (!whatsappId) {
    ticket = await Ticket.count({
      where: {
        contactId,
        companyId,
        status: { [Op.or]: ["open", "pending"] },
      }
    });
  } else {
    ticket = await Ticket.count({
      where: {
        contactId,
        status: { [Op.or]: ["open", "pending"] },
        whatsappId
      }
    });
  }

  if (ticket) {
    throw new AppError("ERR_CONTACT_HAS_OPEN_TICKET");
  }

  return ticket;
};

export default CheckContactOpenTickets;
