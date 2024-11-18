import { Sequelize, Op } from "sequelize";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import User from "../../models/User";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  profile?: string;
  companyId?: number;
}

interface Response {
  users: User[];
  count: number;
  hasMore: boolean;
  onlineCount: number;
  offlineCount: number;
}

const ListUsersService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  // Construir a condição WHERE com busca sensível a maiúsculas e minúsculas
  const whereCondition: any = {
    companyId: {
      [Op.eq]: companyId
    }
  };

  if (searchParam) {
    whereCondition[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${searchParam.toLowerCase()}%`
        }
      },
      {
        email: {
          [Op.iLike]: `%${searchParam.toLowerCase()}%`
        }
      }
    ];
  }

  const limit = 20;
  const offset = limit * (Number(pageNumber) - 1);

  // Encontrar e contar os usuários
  const { count, rows: users } = await User.findAndCountAll({
    where: whereCondition,
    attributes: [
      "name", "id", "email", "companyId", "profile", "allTicket",
      "isTricked", "spy", "createdAt", "online", "startWork", "endWork", "defaultMenu"
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      { model: Queue, as: "queues", attributes: ["id", "name", "color"] },
      { model: Company, as: "company", attributes: ["id", "name"] }
    ]
  });

  // Contar usuários online e offline
  const onlineCount = users.filter(user => user.online).length;
  const offlineCount = users.length - onlineCount;

  // Verificar se há mais usuários para paginar
  const hasMore = count > offset + users.length;

  return {
    users,
    onlineCount,
    offlineCount,
    count,
    hasMore
  };
};

export default ListUsersService;
