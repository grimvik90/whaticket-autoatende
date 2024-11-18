import express from "express";
import isAuth from "../middleware/isAuth";

import * as TicketController from "../controllers/TicketController";

const ticketRoutes = express.Router();

ticketRoutes.get("/tickets", isAuth, TicketController.index);

ticketRoutes.get("/ticketreport/reports", isAuth, TicketController.report);
ticketRoutes.get("/tickets/dash", isAuth, TicketController.dash);
ticketRoutes.get("/tickets/kbu", isAuth, TicketController.kbu);
//ticketRoutes.get("/tickets/kba", isAuth, TicketController.kba);
ticketRoutes.get("/tickets/:ticketId", isAuth, TicketController.show);

ticketRoutes.get("/ticket/kanban", isAuth, TicketController.kanban);

ticketRoutes.get("/tickets/u/:uuid", isAuth, TicketController.showFromUUID);

ticketRoutes.post("/tickets", isAuth, TicketController.store);

ticketRoutes.post("/creatGroupAndTicket", isAuth, TicketController.storeGroupAndTicket);
ticketRoutes.put("/tickets/:ticketId", isAuth, TicketController.update);

ticketRoutes.post("/tickets/closeAll", isAuth, TicketController.closeAll);

ticketRoutes.delete("/tickets/:ticketId", isAuth, TicketController.remove);

ticketRoutes.put("/tickets/value/:ticketId", isAuth, TicketController.updateValue);

ticketRoutes.put("/tickets/:ticketId/name", isAuth, TicketController.updateTicketName);

export default ticketRoutes;
