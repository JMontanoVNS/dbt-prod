-- CreateEnum
CREATE TYPE "discountConditionalEnum" AS ENUM ('OR', 'AND');

-- AlterTable
ALTER TABLE "discounts" ADD COLUMN     "conditional" "discountConditionalEnum" NOT NULL DEFAULT 'OR';
