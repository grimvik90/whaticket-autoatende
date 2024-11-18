import {WAMessage} from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import _ from "lodash";
import formatBody from "../../helpers/Mustache";
import {SendPresenceStatus} from "../../helpers/SendPresenceStatus";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  vCard?: any;
  sendPresence?: boolean;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  vCard,
  sendPresence = false
}: Request): Promise<WAMessage> => {
  let options = {};

  const wbot = await GetTicketWbot(ticket);


  let number = ticket.contact.number;
  if (!ticket.contact.number.includes("@")) {
    number = ticket.isGroup
      ? `${ticket.contact.number}@g.us`
      : `${ticket.contact.number}@s.whatsapp.net`;
  }
  // const number = `${ticket.contact.number.substring(12,0)}-${ticket.contact.number.substring(12)}@${

  //   ticket.isGroup ? "g.us" : "s.whatsapp.net"
  // }`;
  if (quotedMsg) {
    const chatMessage = await Message.findOne({
      where: {
        id: quotedMsg.id
      }
    });

    if (chatMessage) {
      const msgFound = JSON.parse(chatMessage.dataJson);

      options = {
        quoted: {
          key: msgFound?.key || chatMessage.id,
          message: {
            extendedTextMessage: msgFound?.message.extendedTextMessage
          }
        }
      };
    }
  }

  if (!_.isNil(vCard) && !_.isEmpty(vCard)) {
    const vcardNumber = vCard.number;
    const contactName = vCard.name.split(" ")[0];
    const trimName = String(vCard.name).replace(vCard.name.split(" ")[0], "");
    const vcardBody = "BEGIN:VCARD\nVERSION:3.0\n" + ("N:" + trimName + ";" + contactName + ";;;\n") + ("FN:" + vCard.name + "\n") + ("TEL;type=CELL;waid=" + vcardNumber + ":+" + vcardNumber + "\n") + "END:VCARD";
    try {

      const msg = await wbot.sendMessage(number, {
        contacts: {
          displayName: "" + vCard.name,
          contacts: [{
            vcard: vcardBody
          }]
        }
      });
      await ticket.update({
        lastMessage: formatBody(vcardBody, ticket),
        imported: null
      });
      return msg;
    } catch (err) {
      Sentry.captureException(err);

      console.trace(err);
      throw new AppError("ERR_SENDING_WAPP_MSG");
    }
  }

  try {
    if (sendPresence){
        await SendPresenceStatus(wbot, number);
    }

    const sentMessage = await wbot.sendMessage(
      number,
      {
        text: formatBody(body, ticket.contact)
      },
      {
        ...options
      }
    );

    await ticket.update({ lastMessage: formatBody(body, ticket) });
    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};
export default SendWhatsAppMessage;
