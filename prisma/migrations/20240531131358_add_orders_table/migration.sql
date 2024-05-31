-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "store" TEXT NOT NULL,
    "discount_code_id" INTEGER NOT NULL,
    "discount_code" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "order_id" INTEGER NOT NULL,
    "order_total" DOUBLE PRECISION NOT NULL,
    "discount_total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
