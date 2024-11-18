import sequelize from "sequelize";
import database from "../../database";
import nodemailer from "nodemailer";
import Setting from "../../models/Setting";
import { hash } from "bcryptjs";

const ResetPassword = async (email, token, password) => {
  try {
    const { hasResult, data } = await filterUser(email, token);

    if (!hasResult) {
      return { status: 404, message: "Email ou token não encontrado" };
    }

    const convertPassword = await hash(password, 8);
    const { hasResults, datas } = await insertHasPassword(email, token, convertPassword);

    if (!hasResults) {
      return { status: 404, message: "Token não encontrado ou inválido" };
    }

    const [urlSmtpSetting, userSmtpSetting, passwordSmtpSetting, portSmtpSetting] = await Promise.all([
      Setting.findOne({ where: { key: 'smtpauth' } }),
      Setting.findOne({ where: { key: 'usersmtpauth' } }),
      Setting.findOne({ where: { key: 'clientsecretsmtpauth' } }),
      Setting.findOne({ where: { key: 'smtpport' } })
    ]);

    const urlSmtp = urlSmtpSetting?.value;
    const userSmtp = userSmtpSetting?.value;
    const passwordSmpt = passwordSmtpSetting?.value;
    const fromEmail = userSmtp;
    const portSmtp = portSmtpSetting?.value;

    if (!urlSmtp || !userSmtp || !passwordSmpt || !portSmtp) {
      throw new Error("Configurações SMTP estão incompletas");
    }

    const transporter = nodemailer.createTransport({
      host: urlSmtp,
      port: Number(portSmtp),
      secure: false,
      auth: {
        user: userSmtp,
        pass: passwordSmpt
      }
    });

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: "Senha Alterada com Sucesso",
      text: `Olá,\n\nSua senha foi alterada com sucesso.\n\nSe você não realizou essa alteração, entre em contato conosco imediatamente.\n\nAtenciosamente`
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    console.error("Erro ao redefinir senha:", err);
    return { status: 500, message: "Erro interno do servidor" };
  }
};

const filterUser = async (email, token) => {
  const sql = `SELECT * FROM "Users" WHERE email = '${email}' AND "resetPassword" != ''`;
  const result = await database.query(sql, { type: sequelize.QueryTypes.SELECT });
  return { hasResult: result.length > 0, data: result };
};

const insertHasPassword = async (email, token, convertPassword) => {
  const sqlValida = `SELECT * FROM "Users" WHERE email = '${email}' AND "resetPassword" = '${token}'`;
  const resultado = await database.query(sqlValida, { type: sequelize.QueryTypes.SELECT });
  const sqls = `UPDATE "Users" SET "passwordHash"= '${convertPassword}', "resetPassword" = '' WHERE email= '${email}' AND "resetPassword" = '${token}'`;
  const results = await database.query(sqls, { type: sequelize.QueryTypes.UPDATE });

  return { hasResults: results[1] > 0, datas: resultado };
};

export default ResetPassword;
