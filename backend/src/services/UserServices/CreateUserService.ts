import * as Yup from "yup";
import AppError from "../../errors/AppError";
import { SerializeUser } from "../../helpers/SerializeUser";
import User from "../../models/User";
import Plan from "../../models/Plan";
import Company from "../../models/Company";

interface Request {
  email: string;
  password: string;
  name: string;
  queueIds?: number[];
  companyId?: number;
  profile?: string;
  allTicket?: string;
  isTricked?: string;
  whatsappId?: number;
  startWork?: string;
  endWork?: string;
  spy?: string;
  super: boolean;
  defaultMenu: string;
}

interface Response {
  email: string;
  name: string;
  id: number;
  profile: string;
}

const CreateUserService = async ({
  email,
  password,
  name,
  queueIds = [],
  companyId,
  profile = "admin",
  allTicket,
  spy,
  whatsappId,
  startWork,
  endWork,
  isTricked,
  super: superUser,
  defaultMenu,
}: Request): Promise<Response> => {

  // Validação de empresa e limite de usuários
  if (companyId !== undefined) {
    const company = await Company.findOne({
      where: { id: companyId },
      include: [{ model: Plan, as: "plan" }]
    });

    if (company) {
      const usersCount = await User.count({ where: { companyId } });

      if (usersCount >= company.plan.users) {
        throw new AppError(`Número máximo de usuários já alcançado: ${usersCount}`, 400);
      }
    } else {
      throw new AppError("Company not found", 404);
    }
  }

  // Validação com Yup
  const schema = Yup.object().shape({
    name: Yup.string().required().min(2),
    email: Yup.string().email().required().test(
      "Check-email",
      "An user with this email already exists.",
      async value => {
        if (!value) return false;
        const emailExists = await User.findOne({ where: { email: value } });
        return !emailExists;
      }
    ),
    password: Yup.string().required().min(5),
    super: Yup.boolean().required()
  });

  try {
    await schema.validate({ email, password, name, super: superUser });
  } catch (err) {
    throw new AppError(err.message, 400);
  }

  // Criação do usuário
  const user = await User.create({
    email,
    password,
    name,
    companyId,
    profile,
    allTicket,
    whatsappId: whatsappId || null,
    startWork,
    endWork,
    spy,
    isTricked,
    super: superUser,
    defaultMenu,
  });

  // Relacionamento com filas
  if (queueIds.length > 0) {
    await user.$set("queues", queueIds);
  }

  await user.reload();

  const serializedUser = await SerializeUser(user);

  return serializedUser;
};

export default CreateUserService;
