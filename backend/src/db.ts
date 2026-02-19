import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient instance to prevent connection pool exhaustion.
// Multiple PrismaClient instances cause "too many connections" errors.
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['warn', 'error'],
});

export default prisma;
