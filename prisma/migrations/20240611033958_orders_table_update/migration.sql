/*
  Warnings:

  - You are about to drop the column `discount_code` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `discount_code_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `store` on the `orders` table. All the data in the column will be lost.
  - Added the required column `line_items` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "discount_code",
DROP COLUMN "discount_code_id",
DROP COLUMN "store",
ADD COLUMN     "line_items" JSONB NOT NULL,
ALTER COLUMN "order_id" SET DATA TYPE TEXT;
