import {Worker} from "bullmq";
import Schedule from "../models/Schedule";
import * as Sentry from "@sentry/node";
import {logger} from "../utils/logger";
import moment from "moment/moment";
import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import Tag from "../models/Tag";
import {SendMessage} from "../helpers/SendMessage";
import path from "path";
import {Error, Op} from "sequelize";
import Contact from "../models/Contact";
import {Queue as BullQueue} from "bullmq/dist/esm/classes/queue";
import formatBody from "../helpers/Mustache";


export default class ScheduledMessageJob {

  private readonly queue: BullQueue;

  public getQueue() {
    return this.queue;
  }

  constructor(queue: BullQueue, connection) {
    this.queue = queue;
    const campaignWorker = new Worker(queue.name, async (job) => {
      if (job.name == "SendMessage") {
        await this.handleSendScheduledMessage(job);
      } else if (job.name == "VerifySchedules") {
        await this.handleVerifySchedules();
      }
    }, {
      concurrency: 100,
      connection,
      removeOnFail: {count: 3},
    });

    campaignWorker.on("completed", async (job) => {
      logger.info(`Job ${job.name} completed`);
    });

    campaignWorker.on("failed", async (job, err) => {
      logger.error(`Job ${job.name} failed with error: ${err.message}`);
    });

  }

  private async handleVerifySchedules() {
    try {

      const schedules = await Schedule.findAll({
        where: {
          sentAt: null,
          status: "PENDENTE",
          sendAt: {
            [Op.lte]: moment().format("YYYY-MM-DD HH:mm:ss"),
          }
        },
        include: [{model: Contact, as: "contact"}]
      });
      console.log('encontrei agendamentos:', schedules.length)
      if (schedules?.length > 0) {
        schedules.map(async schedule => {
          await schedule.update({
            status: "AGENDADA"
          });
          await this.queue.add(
            "SendMessage",
            {schedule},
            {
              delay: this.getRandomArbitrary(1000, 20000),
              removeOnComplete: true
            }
          );
          logger.info(`Disparo agendado para: ${schedule.contact.name}`);
        });
      }

      return Promise.resolve({count: schedules.length});
    } catch (e) {
      Sentry.captureException(e);
      logger.error("SendScheduledMessage -> Verify: error", (e as Error).message);
      return Promise.reject(new Error(e));
    }
  }

  private getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  private async handleSendScheduledMessage(job) {
    const {
      data: {schedule}
    } = job;
    let scheduleRecord: Schedule | null = null;

    try {
      scheduleRecord = await Schedule.findByPk(schedule.id);
    } catch (e) {
      Sentry.captureException(e);
      logger.info(`Erro ao tentar consultar agendamento: ${schedule.id}`);
    }

    if (scheduleRecord == null || scheduleRecord.status === "ENVIADA" || scheduleRecord.status === "CANCELADA"
    || scheduleRecord.sentAt !== null)
    {
      logger.info(`Agendamento já enviado ou cancelado: ${scheduleRecord?.id}`);
      return;
    }



    try {
      if (scheduleRecord?.daysR !== null) {
        console.log('scheduleRecord:', scheduleRecord.id)

        let existingSendAt = moment(scheduleRecord.sendAt);

        const companyId = schedule.companyId;
        const whatsapp = await GetDefaultWhatsApp(schedule.companyId);
        let filePath = null;


        const tagId = scheduleRecord?.campId;

        if (tagId) {
          Tag.findByPk(tagId)
            .then(async (tag) => {
              if (tag) {
                let newSendAt = existingSendAt
                  .add(tag.rptDays, "days") // Use daysR para adicionar os dias desejados
                  .format("YYYY-MM-DD HH:mm"); //  modName = tag.mediaName; // Faça algo com a tag encontrada
                if (tag.mediaPath) {
                  await SendMessage(whatsapp, {
                    number: schedule.contact.number,
                    body: tag.msgR ? tag.msgR : ""

                  });
                  filePath = path.resolve(__dirname, "..", '..', 'public', `company${companyId}`, tag.mediaPath);
                  await SendMessage(whatsapp, {
                    number: schedule.contact.number,
                    body: tag.msgR ? tag.msgR : "",
                    mediaPath: filePath

                  });
                }
                if (tag.rptDays === 0) {
                  await scheduleRecord?.update({
                    sentAt: moment().format("YYYY-MM-DD HH:mm"),
                    status: "ENVIADA"
                  });
                } else {
                  await scheduleRecord?.update({
                    sendAt: newSendAt,
                    status: "PENDENTE"
                  });
                }


                // Log apenas, não atualiza o status
                logger.info(
                  `Mensagem agendada enviada para: ${schedule.contact.name} `
                );
              } else {
                console.log('Tag não encontrada');
              }
            })
            .catch((error) => {
              console.error('Erro ao buscar tag:', error);
            });
        } else {
          console.log('ID da tag não está definido em scheduleRecord');
        }


      } else {
        const whatsapp = await GetDefaultWhatsApp(schedule.companyId);

        let filePath = null;
        if (schedule.mediaPath) {
          filePath = path.resolve(__dirname, "..", '..', 'public', `company${schedule.companyId}`, schedule.mediaPath);
        }

        var sent = await SendMessage(whatsapp, {
          number: schedule.contact.number,
          body: schedule.body,
          mediaPath: filePath,
          fileName: schedule.mediaName
        });

        await scheduleRecord?.update({
          sentAt: moment().format("YYYY-MM-DD HH:mm"),
          status: "ENVIADA"
        });

        logger.info(`Mensagem agendada enviada para: ${schedule.contact.name} - ${scheduleRecord?.id}`);
      }
    } catch (e: unknown) {
      Sentry.captureException(e);
      await scheduleRecord?.update({
        status: "ERRO"
      });
      logger.error("SendScheduledMessage -> SendMessage: error", (e as Error).message);
      throw e;
    }
  }
}
