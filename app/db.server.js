import { PrismaClient } from "@prisma/client";

let global = { prisma: new PrismaClient() };

const prisma = global.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") {
//   if (!global.prisma) {
//     global.prisma = new PrismaClient();
//   }
// }

export default prisma;
