-- CreateEnum
CREATE TYPE "discountTypeEnum" AS ENUM ('percentage', 'fixedAmount');

-- CreateTable
CREATE TABLE "discounts" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "customerTags" TEXT,
    "productTags" TEXT,
    "status" TEXT NOT NULL,
    "discountType" "discountTypeEnum" NOT NULL DEFAULT 'percentage',
    "discountId" TEXT NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopifyFunction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "api_type" TEXT NOT NULL,

    CONSTRAINT "shopifyFunction_pkey" PRIMARY KEY ("id")
);
