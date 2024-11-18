import User from "../../models/User";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import UpdateDeletedUserOpenTicketsStatus from "../../helpers/UpdateDeletedUserOpenTicketsStatus";

const DeleteUserService = async (
  id: string | number,
  requestUserId: string | number
): Promise<void> => {
  // Encontre o usuário a ser excluído
  const user = await User.findOne({
    where: { id }
  });
  
  
  if(user.id === 1){
  	throw new AppError("CAN_NOT_REMOVE_MASTER_USER", 404);
  }

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  // Encontre o usuário que está fazendo a requisição
  const requestUser = await User.findByPk(requestUserId);

  if (!requestUser) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  // Verifique se o usuário que está fazendo a requisição tem permissão para excluir o usuário
  if (!requestUser.super && user.companyId !== requestUser.companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  // Verifique se o usuário a ser excluído é um superusuário
  if (user.super) {
    throw new AppError("ERR_NO_USER_DELETE", 403);
  }

  // Obtenha os tickets abertos do usuário
  const userOpenTickets: Ticket[] = await user.$get("tickets", {
    where: { status: "open" }
  });

  // Atualize o status dos tickets abertos
  if (userOpenTickets.length > 0) {
    await UpdateDeletedUserOpenTicketsStatus(userOpenTickets, user.companyId);
  }

  // Exclua o usuário
  await user.destroy();
};

export default DeleteUserService;
