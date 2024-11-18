import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import CheckIsValidContact from "./CheckIsValidContact";
import { getWbot } from "../../libs/wbot";

const GetProfilePicUrl = async (
  number: string,
  companyId: number
): Promise<string> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const wbot = getWbot(defaultWhatsapp.id);

  const isGroup = number.endsWith("@g.us") || number.includes("-") || number.length >= 18;
  if (!number.includes("@")) {
    number = isGroup ? number + "@g.us" : number + "@s.whatsapp.net";
  }

  let profilePicUrl: string;
  try {

    profilePicUrl = await wbot.profilePictureUrl(number, null, 5000);
  } catch (error) {
    console.trace(`Error getting profile picture for ${number}: ${error.message}`);
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  return profilePicUrl;
};

export default GetProfilePicUrl;
