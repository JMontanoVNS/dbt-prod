/*
  Warnings:

  - Added the required column `shop` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shop" TEXT NOT NULL;
