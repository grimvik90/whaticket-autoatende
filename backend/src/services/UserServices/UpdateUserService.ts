import * as Yup from "yup";

import AppError from "../../errors/AppError";
import ShowUserService from "./ShowUserService";
import Company from "../../models/Company";
import User from "../../models/User";

interface UserData {
  email?: string;
  password?: string;
  name?: string;
  profile?: string;
  companyId?: number;
  queueIds?: number[];
  allTicket?: string;
  whatsappId?: number;
  startWork?: string;
  endWork?: string;
  spy?: string;
  isTricked?: string;
  super?: boolean;
  defaultMenu?: string;
}

interface Request {
  userData: UserData;
  userId: string | number;
  requestUserId: number;
}

interface Response {
  id: number;
  name: string;
  email: string;
  profile: string;
}

const UpdateUserService = async ({
  userData,
  userId,
  requestUserId
}: Request): Promise<Response | undefined> => {
  // Obtém o usuário a ser atualizado e o usuário que está fazendo a requisição
  const user = await ShowUserService(userId, requestUserId);
  const requestUser: User = await User.findByPk(requestUserId);

  // Verifica permissões
  if (
    !requestUser.super &&
    +userId !== requestUser.id &&
    (user.companyId !== requestUser.companyId ||
      requestUser.profile !== "admin")
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  // Define o esquema de validação usando Yup
  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    email: Yup.string().email(),
    profile: Yup.string(),
    password: Yup.string(),
    super: Yup.boolean()
  });

  const {
    email,
    password,
    profile,
    name,
    queueIds = [],
    allTicket,
    whatsappId,
    startWork,
    endWork,
    spy,
    isTricked,
    super: superStatus,
    defaultMenu
  } = userData;

  try {
    // Valida os dados fornecidos
    await schema.validate({ email, password, profile, name, super: superStatus });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  // Atualiza os dados do usuário
  await user.update({
    email,
    password,
    profile,
    name,
    allTicket,
    whatsappId: whatsappId || null,
    startWork,
    endWork,
    spy,
    isTricked,
    super: superStatus,
    defaultMenu
  });

  // Atualiza as filas associadas ao usuário
  await user.$set("queues", queueIds);

  // Incrementa o tokenVersion do usuário
// Incrementar tokenVersion após a atualização do usuário
  await user.incrementTokenVersion();
  await user.save();

  // Recarrega o usuário para garantir que todas as atualizações foram aplicadas
  await user.reload();

  // Obtém os dados da empresa associada ao usuário
  const company = await Company.findByPk(user.companyId);

  // Serializa o usuário atualizado
  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    companyId: user.companyId,
    company,
    queues: user.queues
  };

  return serializedUser;
};

export default UpdateUserService;
