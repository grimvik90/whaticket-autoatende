import { getWbot } from "../../libs/wbot";
import CreateContactService from "../ContactServices/CreateContactService";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";


interface Request {
    contactsAddGroup: string[];
    whatsappId?: string;
    titleGroup: string;
    companyId: number
  }


  const CreateGroup = async (sock, titleGroup, contactsAddGroup) =>{
    const group = await sock.groupCreate(titleGroup, contactsAddGroup)

    return group
  }


  const CreateGroupService =  async ({
    contactsAddGroup,
    whatsappId,
    titleGroup,
    companyId
}: Request) => {
    try {
        const wbot = getWbot(Number(whatsappId));
        console.log(contactsAddGroup);
        const createdGroup = await CreateGroup(wbot, titleGroup, contactsAddGroup);

        const name = titleGroup;
        const number = (createdGroup?.id ?? '').replace('@g.us', '');
        const isGroup = true;

        // Alteração: Adicionando os parâmetros faltantes
        const contactId = await CreateOrUpdateContactService({name, number, companyId, isGroup}, wbot, null); // Corrigido
        return contactId;
    } catch (error) {
        console.error("Erro ao criar grupo:", error); // Adicionando tratamento de erro
    }
}


export default CreateGroupService;
