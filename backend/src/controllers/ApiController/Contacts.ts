import { Request, Response, NextFunction } from 'express';
import * as Yup from 'yup';
import { getIO } from '../../libs/socket';
import ContactCustomField from '../../models/ContactCustomField';
import ListContactsService from '../../services/ContactServices/ListContactsService';
import CreateContactService from '../../services/ContactServices/CreateContactService';
import ShowContactService from '../../services/ContactServices/ShowContactService';
import UpdateContactService from '../../services/ContactServices/UpdateContactService';
import DeleteContactService from '../../services/ContactServices/DeleteContactService';
import DeleteAllContactService from '../../services/ContactServices/DeleteAllContactService';
import GetContactService from '../../services/ContactServices/GetContactService';
import ToggleDisableBotService from '../../services/ContactServices/ToggleDisableBotService';
import { ImportXLSContactsService } from '../../services/ContactServices/ImportXLSContactsService';
import CheckContactNumber from '../../services/WbotServices/CheckNumber';
import CheckIsValidContact from '../../services/WbotServices/CheckIsValidContact';
import { head } from 'lodash';

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type IndexGetContactQuery = {
  name: string;
  number: string;
};

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface ContactData {
  name: string;
  number: string;
  email?: string;
  extraInfo?: ExtraInfo[];
}

export const listAllContacts = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId } = req.user as { companyId: number };

  try {
    const { contacts, count, hasMore } = await ListContactsService({
      searchParam,
      pageNumber,
      companyId
    });

    return res.json({ contacts, count, hasMore });
  } catch (err) {
    return res.status(500).json({ error: 'Error listing contacts' });
  }
};

export const listOneContact = async (req: Request, res: Response): Promise<Response> => {
  const { name, number } = req.body as IndexGetContactQuery;
  const { companyId } = req.user as { companyId: number };

  try {
    const contact = await GetContactService({
      name,
      number,
      companyId
    });

    return res.status(200).json(contact);
  } catch (err) {
    return res.status(500).json({ error: 'Error retrieving contact' });
  }
};

export const findOrCreateContacts = async (req: Request, res: Response): Promise<Response> => {
  const { name, number } = req.body as IndexGetContactQuery;
  const { companyId } = req.user as { companyId: number };

  try {
    const contact = await GetContactService({
      name,
      number,
      companyId
    });

    return res.status(200).json(contact);
  } catch (err) {
    return res.status(500).json({ error: 'Error finding or creating contact' });
  }
};

export const saveContact = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user as { companyId: number };
  const newContact: ContactData = req.body;
  newContact.number = newContact.number.replace("-", "").replace(" ", "");

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    number: Yup.string()
      .required()
      .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
  });

  try {
    await schema.validate(newContact);
    await CheckIsValidContact(newContact.number, companyId);
    const validNumber = await CheckContactNumber(newContact.number, companyId);
    const number = validNumber.jid.replace(/\D/g, "");
    newContact.number = number;

    const contact = await CreateContactService({ ...newContact, companyId });

    const io = getIO();
    io.emit(`company-${companyId}-contact`, {
      action: "create",
      contact
    });

    return res.status(200).json(contact);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateContact = async (req: Request, res: Response): Promise<Response> => {
  const contactData: ContactData = req.body;
  const { companyId } = req.user as { companyId: number };
  const { contactId } = req.params;

  const schema = Yup.object().shape({
    name: Yup.string(),
    number: Yup.string().matches(
      /^\d+$/,
      "Invalid number format. Only numbers is allowed."
    )
  });

  try {
    await schema.validate(contactData);
    await CheckIsValidContact(contactData.number, companyId);
    const validNumber = await CheckContactNumber(contactData.number, companyId);
    const number = validNumber.jid.replace(/\D/g, "");
    contactData.number = number;

    const contact = await UpdateContactService({
      contactData,
      contactId,
      companyId
    });

    const io = getIO();
    io.emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });

    return res.status(200).json(contact);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const removeContact = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user as { companyId: number };

  try {
    await ShowContactService(contactId, companyId);
    await DeleteContactService(contactId);

    const io = getIO();
    io.emit(`company-${companyId}-contact`, {
      action: "delete",
      contactId
    });

    return res.status(200).json({ message: "Contact deleted" });
  } catch (err) {
    return res.status(500).json({ error: 'Error deleting contact' });
  }
};

export const removeAllContacts = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user as { companyId: number };

  try {
    await DeleteAllContactService(companyId);
    return res.send();
  } catch (err) {
    return res.status(500).json({ error: 'Error deleting all contacts' });
  }
};

export const uploadContacts = async (req: Request, res: Response): Promise<Response> => {
  const files = req.files as Express.Multer.File[];
  const firstFile = head(files); // Utilizando head do lodash corretamente
  const { companyId } = req.user as { companyId: number };

  try {
    const importedContacts = await ImportXLSContactsService(companyId, firstFile);

    const socket = getIO();
    const message = {
      action: "reload",
      records: importedContacts
    };

    socket
      .to(`company-${companyId}-mainchannel`)
      .emit(`company-${companyId}-contact`, message);

    return res.status(200).json(importedContacts);
  } catch (err) {
    return res.status(500).json({ error: 'Error uploading contacts' });
  }
};

export const toggleDisableBotContacts = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const updatedContact = await ToggleDisableBotService(contactId, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-contact`, {
    action: "update",
    contact: updatedContact
  });

  return res.status(200).json(updatedContact);
};
