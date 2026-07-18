import { PrismaClient } from "@prisma/client";

// Single shared Prisma client (connection pool) for the whole process.
export const prisma = new PrismaClient();
