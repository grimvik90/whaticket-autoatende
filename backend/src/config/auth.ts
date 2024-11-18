import { logger } from "../utils/logger";
import { randomBytes } from 'crypto';

type JwtConfig = {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
};

function generateJwtSecret(): string {
  return randomBytes(32).toString('hex'); // Gera uma string hexadecimal de 32 bytes
}

// {{ edit_2: Função para gerar o JWT Refresh Secret com 32 bytes }}
function generateJwtRefreshSecret(): string {
  return randomBytes(32).toString('hex'); // Gera uma string hexadecimal de 32 bytes
}

const jwtConfig: JwtConfig = {
    secret: process.env.JWT_SECRET || generateJwtSecret(),
    expiresIn: "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || generateJwtRefreshSecret(),
    refreshExpiresIn: "365d"
};

logger.debug(`[auth.ts] JWT Secret: ${jwtConfig.secret}`);
logger.debug(`[auth.ts] JWT Refresh Secret: ${jwtConfig.refreshSecret}`);

export default jwtConfig;
