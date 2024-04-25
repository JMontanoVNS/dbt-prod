import { PrismaClient } from "@prisma/client";

console.log({ global });
if (typeof global == "undefined") {
  global = {};
}
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
}

export default prisma;
