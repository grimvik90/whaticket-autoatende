import Setting from "../models/Setting";
import AppError from "../errors/AppError";

export const CheckSettings = async (key: string, defaultValue = null): Promise<string> => {
  const setting = await Setting.findOne({
    where:
     {
       companyId: 1,
       key
     }
  });

  if (!setting) {
    if (!defaultValue)
      throw new AppError("ERR_NO_SETTING_FOUND", 404);

    return defaultValue;
  }

  return setting.value;
};

export const CheckCompanySetting = async (companyId: number, key: string, defaultValue: string = null ): Promise<string> => {
  const setting = await Setting.findOne({
    where:
     {
       companyId,
       key
     }
  });

  if (!setting && !defaultValue) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404);
  }

  return setting?.value || defaultValue;
};
