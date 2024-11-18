import nodemailer from "nodemailer";
import sequelize from "sequelize";
import database from "../../database";
import Setting from "../../models/Setting";
import Company from "../../models/Company";

interface UserData {
  companyId: number;
  // Outras propriedades que você obtém da consulta
}

// Função para verificar se o email existe no banco de dados
const filterEmail = async (email: string) => {
  const sql = `SELECT * FROM "Users" WHERE email ='${email}'`;
  const result = await database.query(sql, { type: sequelize.QueryTypes.SELECT });
  return { hasResult: result.length > 0, data: [result] };
};

const insertToken = async (email: string, tokenSenha: string) => {
  const sqls = `UPDATE "Users" SET "resetPassword"= '${tokenSenha}' WHERE email ='${email}'`;
  const results = await database.query(sqls, { type: sequelize.QueryTypes.UPDATE });
  return { hasResults: results.length > 0, datas: results };
};

const SendMail = async (email: string, tokenSenha: string) => {

    // Verifique se o email existe no banco de dados
    const { hasResult, data } = await filterEmail(email);

    if (!hasResult) {
      return { status: 404, message: "Email não encontrado" };
    }

  const userData = data[0][0] as UserData;

    if (!userData || userData.companyId === undefined) {
      return { status: 404, message: "Dados do usuário não encontrados" };
    }

    const companyId = userData.companyId;

    // Busque as configurações de SMTP do banco de dados para a companyId especificada
    const [urlSmtpSetting, userSmtpSetting, passwordSmtpSetting, portSmtpSetting] = await Promise.all([
      Setting.findOne({ where: { companyId, key: 'smtpauth' } }),
      Setting.findOne({ where: { companyId, key: 'usersmtpauth' } }),
      Setting.findOne({ where: { companyId, key: 'clientsecretsmtpauth' } }),
      Setting.findOne({ where: { companyId, key: 'smtpport' } })
    ]);

    const urlSmtp = urlSmtpSetting?.value;
    const userSmtp = userSmtpSetting?.value;
    const passwordSmtp = passwordSmtpSetting?.value;
    const fromEmail = userSmtp; // Defina o email de origem como o usuário SMTP
    const portSmtp = portSmtpSetting?.value;

    if (!urlSmtp || !userSmtp || !passwordSmtp || !portSmtp) {
      throw new Error("Configurações SMTP estão incompletas");
    }

    const transporter = nodemailer.createTransport({
      host: urlSmtp,
      port: Number(portSmtp), // Defina a porta conforme necessário
      secure: false, // Defina como necessário (false geralmente para SMTP não SSL)
      auth: {
        user: userSmtp,
        pass: passwordSmtp
      }
    });

  if (hasResult === true) {
    const { hasResults, datas } = await insertToken(email, tokenSenha);

    const company = await Company.findByPk(companyId);

    async function sendEmail() {
        try {
          const mailOptions = {
            from: fromEmail,
            to: email,
                subject:  `Redefinição de Senha - ${company.name}`,
                text: `Olá,\n\nVocê solicitou a redefinição de senha para sua conta no ${company.name}. Utilize o seguinte Código de Verificação para concluir o processo de redefinição de senha:\n\nCódigo de Verificação: ${tokenSenha}\n\nPor favor, copie e cole o Código de Verificação no campo 'Código de Verificação' na plataforma ${company.name}.\n\nSe você não solicitou esta redefinição de senha, por favor, ignore este e-mail.\n\n\nAtenciosamente,\nEquipe ${company.name}`
          };

          const info = await transporter.sendMail(mailOptions);
          console.log("E-mail enviado: " + info.response);
      } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
        return { status: 500, message: "Erro interno do servidor" };
      }
    }
    sendEmail();
  };

}

export default SendMail;
