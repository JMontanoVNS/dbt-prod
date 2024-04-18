/*
  Warnings:

  - You are about to alter the column `status` on the `discounts` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `VarChar(191)`.
  - You are about to alter the column `discountType` on the `discounts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `discounts` MODIFY `status` VARCHAR(191) NOT NULL,
    MODIFY `discountType` ENUM('percentage', 'fixedAmount') NOT NULL DEFAULT 'percentage';
