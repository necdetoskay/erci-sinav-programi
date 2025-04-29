import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:P@ssw0rd@localhost:5432/kentkonutdb"
    }
  }
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export { prisma }; 