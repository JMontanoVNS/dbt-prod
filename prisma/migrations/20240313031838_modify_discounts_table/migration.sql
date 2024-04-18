/*
  Warnings:

  - You are about to drop the column `endDate` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `discounts` table. All the data in the column will be lost.
  - Added the required column `discountId` to the `Discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endsAt` to the `Discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsAt` to the `Discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Discounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `discounts` DROP COLUMN `endDate`,
    DROP COLUMN `name`,
    DROP COLUMN `startDate`,
    ADD COLUMN `discountId` VARCHAR(191) NOT NULL,
    ADD COLUMN `endsAt` DATETIME(3) NOT NULL,
    ADD COLUMN `startsAt` DATETIME(3) NOT NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL;
