import * as dotenv from "dotenv";
import path from "path";

// Carregar as variáveis de ambiente do arquivo .env
dotenv.config({ path: path.join(__dirname, '../.env') });

module.exports = {
  define: {
    charset: "utf8mb4", // Charset que suporta emojis e caracteres especiais
    collate: "utf8mb4_bin" // Collate para comparar strings binariamente, útil para senhas e dados sensíveis
  },
  options: {
    requestTimeout: 600000, // Tempo limite de requisição em milissegundos (10 minutos)
    encrypt: true, // Encripta a conexão para maior segurança
  },
  retry: {
    match: [
      /SequelizeConnectionError/, // Erro de conexão geral
      /SequelizeConnectionRefusedError/, // Conexão recusada pelo servidor
      /SequelizeHostNotFoundError/, // Servidor não encontrado
      /SequelizeHostNotReachableError/, // Servidor não acessível
      /SequelizeInvalidConnectionError/, // Erro de conexão inválida
      /SequelizeConnectionTimedOutError/ // Timeout da conexão
    ],
    max: 100 // Número máximo de tentativas de reconexão em caso de erro
  },
  pool: {
    max: 250, // Número máximo de conexões simultâneas
    min: 0, // Número mínimo de conexões no pool
    acquire: 60000, // Tempo máximo para tentar adquirir uma nova conexão (60 segundos)
    idle: 600000 // Tempo máximo que uma conexão pode ficar inativa antes de ser liberada (10 minutos)
  },
  dialect: process.env.DB_DIALECT || "postgres", // Dialeto do banco de dados (por padrão, PostgreSQL)
  timezone: "-03:00", // Fuso horário configurado para UTC-3 (Brasil)
  host: process.env.DB_HOST, // Endereço do host do banco de dados
  port: process.env.DB_PORT || 5432, // Porta padrão do PostgreSQL (5432)
  database: process.env.DB_NAME, // Nome do banco de dados
  username: process.env.DB_USER, // Nome de usuário do banco de dados
  password: process.env.DB_PASS, // Senha do banco de dados
  logging: process.env.DB_DEBUG === "true", // Define se o Sequelize deve exibir logs detalhados
  debug: process.env.DB_DEBUG === "true", // Ativa o modo de depuração do Sequelize
  seederStorage: "sequelize", // Utiliza o Sequelize para gerenciar o armazenamento de seeders (dados iniciais)
};
