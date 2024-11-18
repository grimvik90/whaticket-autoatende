import Whatsapp from "../models/Whatsapp";
import GetWhatsappWbot from "./GetWhatsappWbot";
import fs from "fs";

import {getMessageOptions} from "../services/WbotServices/SendWhatsAppMedia";
import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../services/TicketServices/FindOrCreateTicketService";
import CheckContactNumber from "../services/WbotServices/CheckNumber";
import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import formatBody from "../helpers/Mustache";
import {verifyMessage, verifyQuotedMessage} from "../services/WbotServices/wbotMessageListener";
import Message from "../models/Message";
import mime from "mime";
import CreateMessageService from "../services/MessageServices/CreateMessageService";
import {SendPresenceStatus} from "./SendPresenceStatus";


export type MessageData = {
  number: number | string;
  body: string;
  mediaPath?: string;
  finalName?: string;
  fileName?: string;
};

export const SendMessage = async (
  whatsapp: Whatsapp,
  messageData: MessageData
): Promise<any> => {
  try {
    const wbot = await GetWhatsappWbot(whatsapp);
    const numberToTest = messageData.number;
    const body = messageData.body;

    const companyId = whatsapp.companyId;

    const CheckValidNumber = await CheckContactNumber(numberToTest.toLocaleString(), companyId);
    const number = CheckValidNumber.jid.replace(/\D/g, "");


    const contactData = {
      name: `${number}`,
      number,
      //profilePicUrl,
      isGroup: false,
      companyId
    };

    const contact = await CreateOrUpdateContactService(contactData, wbot, CheckValidNumber.jid);

    const ticket = await FindOrCreateTicketService(contact, whatsapp.id!, 0, companyId);

    const chatId = `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`;

    let message;

    if (messageData.mediaPath) {
      const options = await getMessageOptions(
        messageData.fileName,
        messageData.mediaPath,
        body ? formatBody(body, ticket) : "",
        companyId
      );
      if (options) {
        //const body = fs.readFileSync(messageData.mediaPath);

        await SendPresenceStatus(wbot, chatId, 0, 3000);

        message = message = await wbot.sendMessage(chatId, {
          ...options
        });

        const mimeType = mime.lookup(messageData.mediaPath);

        const quotedMsg = await verifyQuotedMessage(message);

        const insertMsg = {
          id: message.key.id,
          ticketId: ticket.id,
          contactId: message.key.fromMe ? undefined : contact.id,
          body: body ? body : messageData.fileName,
          fromMe: message.key.fromMe,
          read: message.key.fromMe,
          mediaUrl: messageData.finalName,
          mediaType: typeof mimeType === 'string' ? mimeType.split("/")[0] : 'unknown',
          quotedMsgId: quotedMsg?.id,
          ack: 0,
          remoteJid: message.key.remoteJid,
          participant: message.key.participant,
          dataJson: JSON.stringify(message),
        };

        if (typeof insertMsg.body != "string") {
          console.trace("body is not a string", insertMsg.body);
        }
        await ticket.update({
          lastMessage: insertMsg.body,
        });

        await CreateMessageService({
          messageData: insertMsg,
          ticket,
          companyId: ticket.companyId,
        })


      }
    } else {
      const body = `\u200e ${messageData.body}`;
      // message = await wbot.sendMessage(chatId, { text: body });
      await SendPresenceStatus(wbot, chatId);

      message = await wbot.sendMessage(
        chatId,
        {
          text: formatBody(body, ticket)
        });
      await verifyMessage(message, ticket, ticket.contact);
    }

    if (typeof body != "string") {
      console.trace("body is not a string", body);
    }
    await ticket.update({
      lastMessage: body,
    });
    SetTicketMessagesAsRead(ticket);

    return message;
  } catch (err: any) {
    throw new Error(err);
  }
};
