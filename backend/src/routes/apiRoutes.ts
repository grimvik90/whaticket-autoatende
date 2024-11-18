import express from "express";
import multer from "multer";
import uploadConfig from "../config/upload";
import * as InvoicesController from "../controllers/ApiController/Invoices";
import * as CompanyController from "../controllers/ApiController/Company";
import * as ContactsController from "../controllers/ApiController/Contacts";
import * as MessagesController from "../controllers/ApiController/Messages";
import * as TicketController from "../controllers/ApiController/Ticket";
import tokenAuthApiPub from "../middleware/tokenAuthApiPub";

const upload = multer(uploadConfig);
const ApiRoutes = express.Router();

//

// rotas para enviar menssagens //
ApiRoutes.post("/api/messages/send", tokenAuthApiPub, upload.array("medias"), MessagesController.index);
ApiRoutes.post("/api/messages/send/linkPdf", tokenAuthApiPub, MessagesController.indexLink);
ApiRoutes.post("/api/messages/send/linkImage", tokenAuthApiPub, MessagesController.indexImage);
ApiRoutes.post("/api/messages/checkNumber", tokenAuthApiPub, MessagesController.checkNumber);
ApiRoutes.post("/api/messages/send/linkAudio", tokenAuthApiPub, MessagesController.handleAudioLink);

// rotas para manipular tickets //
// trocar fila //
ApiRoutes.post("/api/ticket/QueueUpdate/:ticketId", tokenAuthApiPub, TicketController.updateQueueId);
//encerrarticket
ApiRoutes.post("/api/ticket/close/:ticketId", tokenAuthApiPub, TicketController.closeTicket);

// adicionar e remover tags //
ApiRoutes.post("/api/ticket/TagUpdate", tokenAuthApiPub, TicketController.updateTicketTag);
ApiRoutes.delete("/api/ticket/TagRemove", tokenAuthApiPub, TicketController.removeTicketTag);
// listar tickets //
ApiRoutes.get("/api/ticket/ListTickets", tokenAuthApiPub, TicketController.listTicketsByCompany);
ApiRoutes.get("/api/ticket/ListByTag/:tagId", tokenAuthApiPub, TicketController.listTicketsByTag);

//invoices
ApiRoutes.get("/api/invoices", tokenAuthApiPub, InvoicesController.listAllInvoices);
ApiRoutes.get("/api/invoices/:Invoiceid", tokenAuthApiPub, InvoicesController.showOneInvoice);
ApiRoutes.post("/api/invoices/listByCompany", tokenAuthApiPub, InvoicesController.showAllInvoicesByCompany);
ApiRoutes.put("/api/invoices/:id", tokenAuthApiPub, InvoicesController.updateInvoice);

//contacts
ApiRoutes.get("/api/contacts", tokenAuthApiPub, ContactsController.listAllContacts);
ApiRoutes.get("/api/contacts/list", tokenAuthApiPub, ContactsController.listAllContacts);
ApiRoutes.get("/api/contacts/:contactId", tokenAuthApiPub, ContactsController.listOneContact);
ApiRoutes.post("/api/contacts/findOrCreate", ContactsController.findOrCreateContacts);
ApiRoutes.post("/api/contacts", tokenAuthApiPub, ContactsController.saveContact);
ApiRoutes.put("/api/contacts/:contactId", tokenAuthApiPub, ContactsController.updateContact);
ApiRoutes.delete("/api/contacts/:contactId", tokenAuthApiPub, ContactsController.removeContact);
ApiRoutes.put("/api/contacts/toggleDisableBot/:contactId", tokenAuthApiPub, ContactsController.toggleDisableBotContacts);
ApiRoutes.delete("/api/contacts", tokenAuthApiPub, ContactsController.removeAllContacts);
ApiRoutes.post("/api/contacts/upload", tokenAuthApiPub, upload.array("file"), ContactsController.uploadContacts);

// company
ApiRoutes.post("/api/company/edit/:id", tokenAuthApiPub, CompanyController.updateCompany);
ApiRoutes.post("/api/company/new", tokenAuthApiPub, CompanyController.createCompany);
ApiRoutes.post("/api/company/block", tokenAuthApiPub, CompanyController.blockCompany);

//

export default ApiRoutes;
