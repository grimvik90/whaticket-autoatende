import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import User from "../../models/User";
import Setting from "../../models/Setting";
import GetSuperUserService from "../UserServices/GetSuperUserService";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { SendMail } from '../../helpers/SendMail';
import { SendMessage } from '../../helpers/SendMessage';
import { hash } from "bcryptjs";


interface CompanyData {
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
}

const defaultSettings = [
  { key: "userRating", value: "disabled" },
  { key: "scheduleType", value: "queue" },
  { key: "call", value: "disabled" },
  { key: "CheckMsgIsGroup", value: "enabled" },
  { key: "apiToken", value: "" },
  { key: "sendGreetingAccepted", value: "disabled" },
  { key: "sendMsgTransfTicket", value: "disabled" },
  { key: "chatBotType", value: "text" },
  { key: "allowSignup", value: "enabled" },
  { key: "sendGreetingMessageOneQueues", value: "disabled" },
  { key: "callSuport", value: "disabled" },
  { key: "showTypeBotInMainMenu", value: "disabled" },
  { key: "typeBotIframeUrl", value: "" },
  { key: "displayContactInfo", value: "enabled" },
  { key: "trialExpiration", value: "7" },
  { key: "sendEmailWhenRegister", value: "disabled"},
  { key: "sendMessageWhenRegister", value: "disabled"},
  { key: "smtpauth", value: "disabled" },
  { key: "usersmtpauth", value: "disabled" },
  { key: "clientsecretsmtpauth", value: "" },
  { key: "smtpport", value: "" },
  { key: "wasuport", value: "" },
  { key: "msgsuport", value: "" },
  { key: "ipixc", value: "" },
  { key: "tokenixc", value: "" },
  { key: "ipmkauth", value: "" },
  { key: "clientidmkauth", value: "" },
  { key: "clientsecretmkauth", value: "" },
  { key: "asaas", value: "" }
];

const applyDefaultSettings = async (companyId: number) => {
  for (const setting of defaultSettings) {
    await Setting.findOrCreate({
      where: { companyId, key: setting.key },
      defaults: { ...setting, companyId }
    });
  }
};

const CreateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const {
    name,
    phone,
    email,
    status,
    planId,
    password,
    campaignsEnabled,
    dueDate,
    recurrence
  } = companyData;

  const companySchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_COMPANY_INVALID_NAME")
      .required("ERR_COMPANY_INVALID_NAME")
      .test(
        "Check-unique-name",
        "ERR_COMPANY_NAME_ALREADY_EXISTS",
        async value => {
          if (value) {
            const companyWithSameName = await Company.findOne({
              where: { name: value }
            });

            return !companyWithSameName;
          }
          return false;
        }
      )
  });

  try {
    await companySchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const company = await Company.create({
    name,
    phone,
    email,
    status,
    planId,
    dueDate,
    recurrence
  });



  const user = await User.create({
    name: company.name,
    email: company.email,
    password: password || "mudar@123",
    profile: "admin",
    companyId: company.id
  });

  await applyDefaultSettings(company.id);

    // Check settings and send notifications
    const emailSetting = await Setting.findOne({
      where: { companyId: company.id, key: "sendEmailWhenRegister" }
    });
    const messageSetting = await Setting.findOne({
      where: { companyId: company.id, key: "sendMessageWhenRegister" }
    });

    if (emailSetting && emailSetting.value === "enabled") {
      SendMail({
        to: company.email,
        subject: "Welcome to Our Company",
        text: "Your account has been successfully created."
      });
    }

    if (messageSetting && messageSetting.value === "enabled") {
      // Buscar o WhatsApp padrão da empresa 1
      const defaultCompany = await Company.findByPk(1);
      const defaultWhatsapp = await GetDefaultWhatsApp(defaultCompany.id);

      if (defaultWhatsapp) {
        const messageData = {
          number: company.phone, // Supondo que `phoneNumber` esteja disponível em `company`
          body: "Welcome to Our Company",
        };

        SendMessage(defaultWhatsapp, messageData);
      }
    }

  if (companyData.campaignsEnabled !== undefined) {
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "campaignsEnabled"
      },
      defaults: {
        companyId: company.id,
        key: "campaignsEnabled",
        value: `${campaignsEnabled}`
      },

    });
    if (!created) {
      await setting.update({ value: `${campaignsEnabled}` });
    }
  }

  return company;
};

export default CreateCompanyService;
