import AppError from "../../errors/AppError";
import Company from "../../models/Company";

interface CompanyData {
  id: number | string;
  status: boolean;
}

const BlockCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const company = await Company.findByPk(companyData.id);

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  await company.update({
    status: false
  });

  return company;
};

export default BlockCompanyService;
