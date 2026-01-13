import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_PORT = 4000;

export const config = {
  port: parseInt(process.env.PORT ?? '', 10) || DEFAULT_PORT,
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
