import AppError from "../../errors/AppError";
import Setting from "../../models/Setting";

interface Response {
  key: string;
  value: string;
  companyId: number;
}
const ListSettingByValueService = async (
  value: string
): Promise<Response | undefined> => {
  const settings = await Setting.findOne({
    where: { value }
  });

  if (!settings) {
    throw new AppError("ERR_NO_KEY_FOUND", 404);
  }

  return { key: settings.key, value: settings.value, companyId: settings.companyId };
};

export default ListSettingByValueService;
