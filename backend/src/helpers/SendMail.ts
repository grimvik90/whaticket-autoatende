import nodemailer from "nodemailer";
import Setting from "../models/Setting";

export interface MailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const companyId = 1;

async function loadSmtpSettings(companyId: number) {
  const [urlSmtpSetting, userSmtpSetting, passwordSmtpSetting, portSmtpSetting] = await Promise.all([
    Setting.findOne({ where: { companyId, key: 'smtpauth' } }),
    Setting.findOne({ where: { companyId, key: 'usersmtpauth' } }),
    Setting.findOne({ where: { companyId, key: 'clientsecretsmtpauth' } }),
    Setting.findOne({ where: { companyId, key: 'smtpport' } })
  ]);

  return {
    urlSmtp: urlSmtpSetting?.value,
    userSmtp: userSmtpSetting?.value,
    passwordSmtp: passwordSmtpSetting?.value,
    portSmtp: portSmtpSetting?.value,
  };
}

export async function SendMail(mailData: MailData) {
  const { urlSmtp, userSmtp, passwordSmtp, portSmtp } = await loadSmtpSettings(companyId);
  const transporter = nodemailer.createTransport({
    host: urlSmtp,
    port: Number(portSmtp), // Defina a porta conforme necessário
    secure: false, // Defina como necessário (false geralmente para SMTP não SSL)
    auth: {
      user: userSmtp,
      pass: passwordSmtp
    }
  });

  // send mail with defined transport object
  let info = transporter.sendMail({
    from: userSmtp, // sender address
    to: mailData.to, // list of receivers
    subject: mailData.subject, // Subject line
    text: mailData.text, // plain text body
    html: mailData.html || mailData.text // html body
  });

 console.log("Message sent: %s", info);
}
