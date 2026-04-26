import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client. Importing this from multiple files reuses the
 * same connection pool — important because Prisma instantiates a real DB
 * client which is expensive to create.
 */
export const prisma = new PrismaClient();
