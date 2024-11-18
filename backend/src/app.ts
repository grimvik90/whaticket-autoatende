
import * as Sentry from "@sentry/node";
import  { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

import "./database";
import "reflect-metadata";
import "express-async-errors";
import express, {Request, Response, NextFunction} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import uploadConfig from "./config/upload";
import AppError from "./errors/AppError";
import routes from "./routes";
import {logger} from "./utils/logger";
import {messageQueue} from "./queues";
import path from "path";

if (process.env.DEBUG_TRACE == 'false') {
  console.trace = function () {
    return;
  }
}

const app = express();

process.on("uncaughtException", err => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
});

app.set("queues", {
  messageQueue
});

app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
  })
);


app.use(express.json({limit: '50mb'})); // Para JSON
app.use(express.urlencoded({limit: '50mb', extended: true})); // Para formulários

app.use(cookieParser());
app.use("/public", async (req: Request, res: Response, next: NextFunction) => {
  return express.static(uploadConfig.directory)(req, res, next);
});
app.use(routes);
app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    return res.status(err.statusCode).json({error: err.message});
  }

  logger.error(err);
  return res.status(500).json({error: "Internal server error"});
});

export default app;
