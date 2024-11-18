import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import * as Sentry from "@sentry/node";
import { getIO } from "../../libs/socket";
import ShowTicketService from "./ShowTicketService";

interface Request {
  ticketData: {
    value?: number;
    sku?: string;
  };
  ticketId: string | number;
  companyId?: number;
}

const UpdateTicketValueService = async ({
  ticketData,
  ticketId,
  companyId,
}: Request): Promise<Ticket> => {
  try {
    if (!companyId) {
      throw new Error("Need companyId or tokenData");
    }

    let ticket = await ShowTicketService(ticketId, companyId);
    if (!ticket) {
      throw new AppError("Ticket not found");
    }

    if (ticket.companyId !== companyId) {
      throw new AppError("Unauthorized access to ticket", 403);
    }

    ticket.sku = ticketData.sku;
    ticket.value = ticketData.value;
    console.log('valor de sku [%s]', ticketData.sku);
    console.log('valor de value [%s]', ticketData.value);
    await ticket.save();

    const io = getIO();
    io.to(`company-${companyId}-ticket-${ticketId}`).emit("ticketUpdated", {
      ticketId: ticket.id,
      value: ticket.value,
      sku: ticket.sku
    });

    return ticket;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
};

export default UpdateTicketValueService;
