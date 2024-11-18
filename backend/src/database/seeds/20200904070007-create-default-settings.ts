import { QueryInterface } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
        return queryInterface.sequelize.transaction(async t => {
            return Promise.all([
                queryInterface.bulkInsert(
                    "Settings",
                    [
                        {
                            key: "userRating",
                            value: "disabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                          key: "downloadLimit",
                          value: "15", // Ajuste conforme necessário
                          companyId: 1,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        },
                        {
                          key: "enableTicketValueAndSku",
                          value: "disabled", // Ajuste conforme necessário
                          companyId: 1,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        },
                        {
                          key: "quickMessage",
                          value: "individual", // Ajuste conforme necessário
                          companyId: 1,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        },
                        {
                            key: "scheduleType",
                            value: "queue", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "call",
                            value: "disabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "CheckMsgIsGroup",
                            value: "enabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "apiToken",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "sendGreetingAccepted",
                            value: "disabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "sendMsgTransfTicket",
                            value: "disabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                          key: "sendEmailWhenRegister",
                          value: "disabled", // Ajuste conforme necessário
                          companyId: 1,
                          createdAt: new Date(),
                          updatedAt: new Date()
                      },
                      {
                        key: "sendMessageWhenRegister",
                        value: "disabled", // Ajuste conforme necessário
                        companyId: 1,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                        {
                            key: "chatBotType",
                            value: "text", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "allowSignup",
                            value: "enabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "sendGreetingMessageOneQueues",
                            value: "disabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "callSuport",
                            value: "disabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                          key: "enableAllConnections",
                          value: "disabled", // Ajuste conforme necessário
                          companyId: 1,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        },
                        {
                            key: "showTypeBotInMainMenu",
                            value: "disabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "typeBotIframeUrl",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "displayContactInfo",
                            value: "enabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "trialExpiration",
                            value: "7", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "smtpauth",
                            value: "disabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "usersmtpauth",
                            value: "disabled", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "clientsecretsmtpauth",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "smtpport",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "wasuport",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "msgsuport",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "ipixc",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "tokenixc",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "ipmkauth",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "clientidmkauth",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "clientsecretmkauth",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            key: "asaas",
                            value: "", // Ajuste conforme necessário
                            companyId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    ],
                    { transaction: t }
                )
            ]);
        });
    },

    down: async (queryInterface: QueryInterface) => {
        return queryInterface.bulkDelete("Settings", {});
    }
};
