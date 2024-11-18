import * as Sentry from "@sentry/node";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import CreateContactService from "../ContactServices/CreateContactService";
import { isString, isArray } from "lodash";
import path from "path";
import fs from 'fs';

const ImportContactsService = async (companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  const wbot = getWbot(defaultWhatsapp.id);

  let phoneContacts;

  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public", `company${defaultWhatsapp.companyId}`);

  try {
    const contactsString = await ShowBaileysService(wbot.id);
    phoneContacts = JSON.parse(contactsString.contacts);

    const beforeFilePath = path.join(publicFolder, 'contatos_antes.txt');
    await fs.promises.writeFile(beforeFilePath, JSON.stringify(phoneContacts, null, 2));
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
    return;
  }

  try {
    const afterFilePath = path.join(publicFolder, 'contatos_depois.txt');
    await fs.promises.writeFile(afterFilePath, JSON.stringify(phoneContacts, null, 2));
  } catch (err) {
    logger.error(`Failed to write contacts to file: ${err}`);
    throw err;
  }

  let phoneContactsList;
  try {
    phoneContactsList = isString(phoneContacts)
      ? JSON.parse(phoneContacts)
      : phoneContacts;
  } catch (err) {
    logger.error(`Invalid phone contacts format: ${err}`);
    return;
  }

  if (isArray(phoneContactsList)) {
    for (const { id, name, notify } of phoneContactsList) {
      if (id === "status@broadcast" || id.includes("g.us")) continue;
      const number = id.replace(/\D/g, "");

      const existingContact = await Contact.findOne({
        where: { number, companyId }
      });

      if (existingContact) {
        existingContact.name = name || notify;
        await existingContact.save();
      } else {
        try {
          await CreateContactService({
            number,
            name: name || notify,
            companyId
          });
        } catch (error) {
          Sentry.captureException(error);
          logger.warn(`Could not create contact. Err: ${error}`);
        }
      }
    }
  } else {
    logger.error("No valid phone contacts list available for processing.");
  }
};

export default ImportContactsService;
