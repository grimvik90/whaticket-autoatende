import { Request, Response, NextFunction } from "express";
import AppError from "../../errors/AppError";
import * as Yup from "yup";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import formatBody from "../../helpers/Mustache";

import FindOrCreateTicketService from "../../services/TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../../services/TicketServices/UpdateTicketService";
import ShowTicketService from "../../services/TicketServices/ShowTicketService";
import SendWhatsAppMessage from "../../services/WbotServices/SendWhatsAppMessage";
import CheckContactNumber from "../../services/WbotServices/CheckNumber";
import CreateOrUpdateContactService from "../../services/ContactServices/CreateOrUpdateContactService";
import GetWhatsappWbot from "../../helpers/GetWhatsappWbot";
import SendWhatsAppMessageLink from "../../services/WbotServices/SendWhatsAppMessageLink";
import SendWhatsAppMediaImage from "../../services/WbotServices/SendWhatsappMediaImage";
import SendWhatsAppMedia from "../../services/WbotServices/SendWhatsAppMedia";
import GetProfilePicUrl from "../../services/WbotServices/GetProfilePicUrl";
import CheckIsValidContact from "../../services/WbotServices/CheckIsValidContact";
import ApiUsages from "../../models/ApiUsages";
import { useDate } from "../../utils/useDate";
import moment from "moment";
import path from "path";
import axios from "axios";
import fs from "fs";
import { SendPresenceStatus } from "../../helpers/SendPresenceStatus";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";

type MessageData = {
  body: string;
  fromMe: boolean;
  isGroup: boolean;
  read: boolean;
  quotedMsg?: Message;
  number?: string;
  closeTicket?: true;
};

type ContactData = {
  name: string;
  number: string;
  email?: string;
};

type WhatsappData = { whatsappId: number };

const createContact = async (
  whatsappId: number | undefined,
  companyId: number | undefined,
  newContact: string,
  isApi?: boolean
) => {
  await CheckIsValidContact(newContact, companyId);
  const validNumber = await CheckContactNumber(newContact, companyId);
  const profilePicUrl = await GetProfilePicUrl(validNumber.jid, companyId);
  const number = validNumber.jid;
  const isGroup =
    validNumber.jid.endsWith("@g.us") ||
    validNumber.jid.includes("-") ||
    validNumber.jid.length > 20;

  const contactData = {
    name: `${number}`,
    number,
    profilePicUrl,
    isGroup: isApi ? false : isGroup,
    companyId
  };
  const contact = await CreateOrUpdateContactService(contactData, null, null);
  let whatsapp: Whatsapp | null;

  if (whatsappId === undefined) {
    whatsapp = await GetDefaultWhatsApp(companyId);
  } else {
    whatsapp = await Whatsapp.findByPk(whatsappId);
    if (whatsapp === null) {
      throw new AppError(`whatsapp #${whatsappId} not found`);
    }
  }

  const createTicket = await FindOrCreateTicketService(
    contact,
    whatsapp.id,
    0,
    companyId
  );
  const ticket = await ShowTicketService(createTicket.id, companyId);
  SetTicketMessagesAsRead(ticket);

  return ticket;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const newContact: ContactData = req.body;
  let { whatsappId }: WhatsappData = req.body;
  const { msdelay }: any = req.body;
  const { token }: any = req.body;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];


  const whatsapp = await Whatsapp.findOne({ where: { token } });
  if (!whatsapp) {
    throw new AppError("Api-Message: Invalid token");
  }

  if (!whatsappId) {
    whatsappId = whatsapp.id;
  }

  const companyId = whatsapp.companyId;

  const contactAndTicket = await createContact(
    whatsappId,
    companyId,
    newContact.number,
    true
  );

  if (medias?.length > 0) {
    await Promise.all(
      medias.map(async (media: Express.Multer.File) => {
        await SendWhatsAppMedia({ media, ticket: contactAndTicket, body });
      })
    );
  } else {
    await SendWhatsAppMessage({
      body,
      ticket: contactAndTicket,
      quotedMsg,
      sendPresence: true
    });
  }
  setTimeout(async () => {
    await UpdateTicketService({
      ticketId: contactAndTicket.id,
      ticketData: {
        status: "pending",
        sendFarewellMessage: false,
        amountUsedBotQueues: 0
      },
      companyId
    });
  }, 100);
  return res.send({status: "SUCCESS"});
};

export const indexLink = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const newContact: ContactData = req.body;
  const { whatsappId }: WhatsappData = req.body;
  const { msdelay }: any = req.body;
  const url = req.body.url;
  const caption = req.body.caption;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const whatsapp = await Whatsapp.findOne({ where: { token } });
  const companyId = whatsapp.companyId;
  newContact.number = newContact.number.replace("-", "").replace(" ", "");
  const schema = Yup.object().shape({
    number: Yup.string()
      .required()
      .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
  });
  try {
    await schema.validate(newContact);
  } catch (err: any) {
    throw new AppError(err.message);
  }
  const contactAndTicket = await createContact(
    whatsappId,
    companyId,
    newContact.number,
    true
  );
  await SendWhatsAppMessageLink({
    ticket: contactAndTicket,
    url,
    caption,
    msdelay
  });
  setTimeout(async () => {
    await UpdateTicketService({
      ticketId: contactAndTicket.id,
      ticketData: {
        status: "pending",
        sendFarewellMessage: false,
        amountUsedBotQueues: 0
      },
      companyId
    });
  }, 200);

  return res.send({ status: "SUCCESS" });
};

export const indexImage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const newContact: ContactData = req.body;
  const { whatsappId }: WhatsappData = req.body;
  const { msdelay }: any = req.body;
  const url = req.body.url;
  const caption = req.body.caption;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const whatsapp = await Whatsapp.findOne({ where: { token } });
  const companyId = whatsapp.companyId;
  newContact.number = newContact.number.replace("-", "").replace(" ", "");
  const schema = Yup.object().shape({
    number: Yup.string()
      .required()
      .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
  });
  try {
    await schema.validate(newContact);
  } catch (err: any) {
    throw new AppError(err.message);
  }
  const contactAndTicket = await createContact(
    whatsappId,
    companyId,
    newContact.number,
    true
  );
  if (url) {
    await SendWhatsAppMediaImage({
      ticket: contactAndTicket,
      url,
      caption,
      msdelay
    });
  }
  setTimeout(async () => {
    await UpdateTicketService({
      ticketId: contactAndTicket.id,
      ticketData: {
        status: "pending",
        sendFarewellMessage: false,
        amountUsedBotQueues: 0
      },
      companyId
    });
  }, 100);

  return res.send({ status: "SUCCESS" });
};

function formatBRNumber(jid: string) {
  const regexp = new RegExp(/^(\d{2})(\d{2})\d{1}(\d{8})$/);
  if (regexp.test(jid)) {
    const match = regexp.exec(jid);
    if (
      match &&
      match[1] === "55" &&
      Number.isInteger(Number.parseInt(match[2]))
    ) {
      const ddd = Number.parseInt(match[2]);
      if (ddd < 31) {
        return match[0];
      } else if (ddd >= 31) {
        return match[1] + match[2] + match[3];
      }
    }
  } else {
    return jid;
  }
}

function createJid(number: string) {
  if (number.includes("@g.us") || number.includes("@s.whatsapp.net")) {
    return formatBRNumber(number) as string;
  }
  return number.includes("-")
    ? `${number}@g.us`
    : `${formatBRNumber(number)}@s.whatsapp.net`;
}

export const checkNumber = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const newContact: ContactData = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("Authorization header is missing");
    return res.status(401).json({ error: "Authorization header is required" });
  }

  let token = authHeader;

  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  const whatsapp = await Whatsapp.findOne({ where: { token } });
  const companyId = whatsapp.companyId;
  const number = newContact.number.replace("-", "").replace(" ", "");
  const whatsappDefault = await GetDefaultWhatsApp(companyId);
  const wbot = getWbot(whatsappDefault.id);
  const jid = createJid(number);
  try {
    const [result] = (await wbot.onWhatsApp(jid)) as {
      exists: boolean;
      jid: string;
    }[];
    return res.status(200).json({
      existsInWhatsapp: true,
      number: number,
      numberFormatted: result.jid
    });
  } catch (error) {
    return res.status(400).json({
      existsInWhatsapp: false,
      number: jid,
      error: "Not exists on Whatsapp"
    });
  }
};

export function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const handleAudioLink = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { link, contactNumber } = req.body;
  // Defina o caminho onde deseja salvar o arquivo de áudio baixado

  try {
    // Obtenha o WhatsApp associado ao token
    const authHeader = req.headers.authorization;
    const [, token] = authHeader.split(" ");
    const whatsapp = await Whatsapp.findOne({ where: { token } });
    const companyId = whatsapp.companyId;
    const whatsappDefault = await GetDefaultWhatsApp(companyId);
    const wbot = getWbot(whatsappDefault.id);

    const localFilePath = `./public/company${companyId}/${makeid(10)}.mp3`;

    if (!whatsapp) {
      return res
        .status(401)
        .json({ status: "ERRO", error: "Token de autorização inválido" });
    }

    // Baixe o áudio do link
    const response = await axios.get(link, { responseType: "arraybuffer" });
    fs.writeFileSync(localFilePath, Buffer.from(response.data));

    // Use o código existente para enviar a mensagem de áudio
    const caption = "Legenda do áudio";

    await SendPresenceStatus(wbot, contactNumber);

    await wbot.sendMessage(`${contactNumber}@s.whatsapp.net`, {
      audio: fs.readFileSync(localFilePath),
      fileName: caption,
      caption: caption,
      mimetype: "audio/mp4", // Defina o tipo de mídia correto para arquivos de áudio
      ptt: true
    });

    return res.status(200).json({ status: "SUCESSO" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "ERRO", error: "Erro ao lidar com o link de áudio" });
  }
};
