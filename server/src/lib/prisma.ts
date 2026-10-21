import { PrismaClient } from "@prisma/client";

// Uma única instância para todo o servidor
export const prisma = new PrismaClient();