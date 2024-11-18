import axios from "axios";
import Ticket from "../../models/Ticket";
import QueueIntegrations from "../../models/QueueIntegrations";
import {WASocket, delay, proto} from "@whiskeysockets/baileys";
import {getBodyMessage} from "../WbotServices/wbotMessageListener";
import {logger} from "../../utils/logger";
import {isNil} from "lodash";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import {SendPresenceStatus} from "../../helpers/SendPresenceStatus";


type Session = WASocket & {
  id?: number;
};

interface Request {
  wbot: Session;
  msg: proto.IWebMessageInfo;
  ticket: Ticket;
  typebot: QueueIntegrations;
  queueValues?: string[];
}


const typebotListener = async ({
                                 wbot,
                                 msg,
                                 ticket,
                                 typebot,
                                 queueValues = null
                               }: Request): Promise<boolean> => {

  if (msg.key.remoteJid === 'status@broadcast') return;


  const {
    urlN8N: url,
    typebotExpires,
    typebotKeywordFinish,
    typebotKeywordRestart,
    typebotUnknownMessage,
    typebotSlug,
    typebotDelayMessage,
    typebotRestartMessage,

  } = typebot;

  const number = msg.key.remoteJid.replace(/\D/g, '');

  let body = getBodyMessage(msg);

  async function createSession(msg, typebot, number) {
    try {
      var reqBody = {
        "isStreamEnabled": true,
        "message": "string",
        "resultId": "string",
        "isOnlyRegistering": false,
        "prefilledVariables": {

          "number": number,
          "numero": number,
          "pushName": msg.pushName || "",
          "nome": ticket?.contact?.name || "",
          "ticketId": ticket?.id || "",
          "remoteJid": ticket?.contact?.remoteJid
        },
      };
      console.log('queuevalues',queueValues)
      if (queueValues) {
        queueValues.forEach((item, index) => {
          reqBody.prefilledVariables[`fila${index + 1}`] = item;
        });
      }
      const reqData = JSON.stringify(reqBody);

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${url}/api/v1/typebots/${typebotSlug}/startChat`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: reqData
      };

      const request = await axios.request(config);

      return request.data;

    } catch (err) {
      logger.info("Erro ao criar sessão do typebot: ", err)
      throw err;
    }
  }


  let sessionId
  let dataStart
  let status = false;
  try {
    const dataLimite = new Date()
    dataLimite.setMinutes(dataLimite.getMinutes() - Number(typebotExpires));


    if (typebotExpires > 0 && ticket.updatedAt < dataLimite) {
      console.trace("Ticket expirado")
      await ticket.update({
        typebotSessionId: null,
        chatbot: true
      });

      await ticket.reload();
    }

    console.log(ticket.typebotSessionId);
    if (!ticket.typebotSessionId) {


      dataStart = await createSession(msg, typebot, number);


      sessionId = dataStart.sessionId
      status = true;
      await ticket.update({
        typebotSessionId: sessionId,
        typebotStatus: true,
        useIntegration: true,
        integrationId: typebot.id
      })
      await ticket.reload();

    } else {
      sessionId = ticket.typebotSessionId;
      status = ticket.typebotStatus;
    }

    if (!status) {

      return
    }
    ;

    //let body = getConversationMessage(msg);


    if (body !== typebotKeywordFinish && body !== typebotKeywordRestart) {
      let requestContinue
      let messages
      let input
      if (dataStart?.messages.length === 0 || dataStart === undefined) {
        const reqData = JSON.stringify({
          "message": body
        });

        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: `${url}/api/v1/sessions/${sessionId}/continueChat`,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          data: reqData
        };
        requestContinue = await axios.request(config);


        messages = requestContinue.data?.messages;
        input = requestContinue.data?.input;
      } else {
        messages = dataStart?.messages;
        input = dataStart?.input;
      }

      if (messages?.length === 0) {
        console.log('sem mensagens!!! tentar procurar uma fila?')
        //await wbot.sendMessage(`${number}@c.us`, {text: typebotUnknownMessage});
        return false;
      } else {

        for (const message of messages) {
          if (message.type === 'text') {
            let formattedText = '';
            let linkPreview = false;

            for (const richText of message.content.richText) {
              for (const element of richText.children) {
                let text = '';

                if (element.text) {
                  text = element.text;
                }
                if (element.type && element.children) {
                  for (const subelement of element.children) {
                    let text = '';

                    if (subelement.text) {
                      text = subelement.text;
                    }

                    if (subelement.type && subelement.children) {
                      for (const subelement2 of subelement.children) {
                        let text = '';

                        if (subelement2.text) {
                          text = subelement2.text;
                        }

                        if (subelement2.bold) {
                          text = `*${text}*`;
                        }
                        if (subelement2.italic) {
                          text = `_${text}_`;
                        }
                        if (subelement2.underline) {
                          text = `~${text}~`;
                        }
                        if (subelement2.url) {
                          const linkText = subelement2.children[0].text;
                          text = `[${linkText}](${subelement2.url})`;
                          linkPreview = true;
                        }
                        formattedText += text;
                      }
                    }
                    if (subelement.bold) {
                      text = `*${text}*`;
                    }
                    if (subelement.italic) {
                      text = `_${text}_`;
                    }
                    if (subelement.underline) {
                      text = `~${text}~`;
                    }
                    if (subelement.url) {
                      const linkText = subelement.children[0].text;
                      text = `[${linkText}](${subelement.url})`;
                      linkPreview = true;
                    }
                    formattedText += text;
                  }
                }

                if (element.bold) {
                  text = `*${text}*`
                }
                if (element.italic) {
                  text = `_${text}_`;
                }
                if (element.underline) {
                  text = `~${text}~`;
                }

                if (element.url) {
                  const linkText = element.children[0].text;
                  text = `[${linkText}](${element.url})`;
                  linkPreview = true;
                }

                formattedText += text;
              }
              formattedText += '\n';
            }
            formattedText = formattedText.replace('**', '').replace(/\n$/, '');

            if (formattedText === "Invalid message. Please, try again.") {
              formattedText = typebotUnknownMessage;
            }


            if (formattedText.startsWith("#")) {
              let gatilho = formattedText.replace("#", "");

              try {
                let jsonGatilho = JSON.parse(gatilho);

                if (jsonGatilho.stopBot && isNil(jsonGatilho.userId) && isNil(jsonGatilho.queueId)) {
                  console.log("Entrou no gatilho 2")
                  await ticket.update({
                    useIntegration: false,
                    chatbot: false
                  })

                  return;
                }
                if (!isNil(jsonGatilho.queueId) && jsonGatilho.queueId > 0 && isNil(jsonGatilho.userId)) {
                  console.log("Entrou no gatilho 3")

                  await UpdateTicketService({
                    ticketData: {
                      queueId: jsonGatilho.queueId,
                      chatbot: false,
                      useIntegration: false,
                      integrationId: null
                    },
                    ticketId: ticket.id,
                    companyId: ticket.companyId
                  })

                  return;
                }

                if (!isNil(jsonGatilho.queueId) && jsonGatilho.queueId > 0 && !isNil(jsonGatilho.userId) && jsonGatilho.userId > 0) {

                  console.log("Entrou no gatilho")
                  await UpdateTicketService({
                    ticketData: {
                      queueId: jsonGatilho.queueId,
                      userId: jsonGatilho.userId,
                      chatbot: false,
                      useIntegration: false,
                      integrationId: null
                    },
                    ticketId: ticket.id,
                    companyId: ticket.companyId
                  })

                  return;
                }
              } catch (err) {
                throw err
              }
            }

            await SendPresenceStatus(wbot, msg.key.remoteJid, typebotDelayMessage)
            await wbot.sendMessage(msg.key.remoteJid, {text: formattedText});
          }

          if (message.type === 'audio') {
            await SendPresenceStatus(wbot, msg.key.remoteJid, typebotDelayMessage)

            const media = {
              audio: {
                url: message.content.url,
                mimetype: 'audio/mp4',
                ptt: true
              },
            }
            await wbot.sendMessage(msg.key.remoteJid, media);

          }

          // if (message.type === 'embed') {
          //     await wbot.presenceSubscribe(msg.key.remoteJid)
          //     //await delay(2000)
          //     await wbot.sendPresenceUpdate('composing', msg.key.remoteJid)
          //     await delay(typebotDelayMessage)
          //     await wbot.sendPresenceUpdate('paused', msg.key.remoteJid)
          //     const media = {

          //         document: { url: message.content.url },
          //         mimetype: 'application/pdf',
          //         caption: ""

          //     }
          //     await wbot.sendMessage(msg.key.remoteJid, media);
          // }

          if (message.type === 'image') {

            await SendPresenceStatus(wbot, msg.key.remoteJid, typebotDelayMessage)
            const media = {
              image: {
                url: message.content.url,
              },

            }
            await wbot.sendMessage(msg.key.remoteJid, media);
          }

          // if (message.type === 'video' ) {
          //     await wbot.presenceSubscribe(msg.key.remoteJid)
          //     //await delay(2000)
          //     await wbot.sendPresenceUpdate('composing', msg.key.remoteJid)
          //     await delay(typebotDelayMessage)
          //     await wbot.sendPresenceUpdate('paused', msg.key.remoteJid)
          //     const media = {
          //         video: {
          //             url: message.content.url,
          //         },

          //     }
          //     await wbot.sendMessage(msg.key.remoteJid, media);
          // }
        }
        if (input) {
          if (input.type === 'choice input') {
            let formattedText = '';
            const items = input.items;

            for (const item of items) {
              formattedText += `▶️ ${item.content}\n`;
            }
            formattedText = formattedText.replace(/\n$/, '');

            await SendPresenceStatus(wbot, msg.key.remoteJid, typebotDelayMessage)
            await wbot.sendMessage(msg.key.remoteJid, {text: formattedText});

          }
        }
      }

      return true;
    } else if (body === typebotKeywordRestart) {

      await ticket.update({
        chatbot: true,
        typebotSessionId: null

      })
      console.log('ticket restart')

      await wbot.sendMessage(`${number}@c.us`, {text: typebotRestartMessage})

    } else if (body === typebotKeywordFinish) {
      console.log("Entrou no gatilho 4")

      ticket.set({typebotSessionId: null});

      await UpdateTicketService({
        ticketData: {
          status: "closed",
          useIntegration: false,
          integrationId: null
        },
        ticketId: ticket.id,
        companyId: ticket.companyId
      })

      return;
    }
  } catch (error) {
    logger.info("Error on typebotListener: ", error);

    await ticket.update({
      typebotSessionId: null
    })
  }
}

export default typebotListener;
