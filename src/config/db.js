import { PrismaClient } from '@prisma/client';
import { env, isProduction } from './env.js';

const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['warn', 'error'],
});

const getDatabaseInfo = () => {
  const databaseUrl = new URL(env.DATABASE_URL);
  const host = databaseUrl.hostname;
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

  return {
    location: localHosts.has(host) ? 'LOCAL (same machine/VPS)' : 'HOSTED (remote server)',
    host,
    port: databaseUrl.port || '5432',
    database: databaseUrl.pathname.slice(1) || '(unknown)',
  };
};

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    const db = getDatabaseInfo();
    console.log(
      `[db] Connected: ${db.location} | database=${db.database} | host=${db.host} | port=${db.port}`,
    );
  } catch (error) {
    console.error('[db] Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  console.log('[db] PostgreSQL connection closed.');
};

export default prisma;
