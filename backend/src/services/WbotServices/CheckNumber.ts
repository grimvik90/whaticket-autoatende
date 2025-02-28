import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import {getWbot, Session} from "../../libs/wbot";

interface IOnWhatsapp {
  jid: string;
  exists: boolean;
}

const checker = async (number: string, wbot: Session) => {
  const isGroup = number.endsWith("@g.us") || number.includes("-") || number.length >= 18;
  if (isGroup) {

    var num = number;
    if (!num.includes("@g.us")) {
      num = num + "@g.us";
    }

    const groupData = await wbot.groupMetadata(num);

    if (groupData) {
      return [{
        jid: groupData.id,
        exists: true
      }];
    }
  }
  return await wbot.onWhatsApp(`${number}@s.whatsapp.net`);
}

const CheckContactNumber = async (
  number: string,
  companyId: number
): Promise<IOnWhatsapp> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const wbot = getWbot(defaultWhatsapp.id);

  const isNumberExit = await checker(number, wbot);


  if (!isNumberExit?.length || !isNumberExit[0].exists) {
    throw new Error("ERR_CHECK_NUMBER");
  }

  return isNumberExit[0];
};

export default CheckContactNumber;
