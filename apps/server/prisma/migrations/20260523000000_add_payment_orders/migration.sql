CREATE TABLE "payment_orders" (
    "id" SERIAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT,
    "shopName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tradeStatus" TEXT NOT NULL DEFAULT 'WAIT_BUYER_PAY',
    "tradeNo" TEXT,
    "subject" TEXT NOT NULL,
    "goodsAmount" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL,
    "payableAmount" DECIMAL(10,2) NOT NULL,
    "cartItems" JSONB NOT NULL,
    "notifyPayload" JSONB,
    "queryPayload" JSONB,
    "buyerPayAmount" DECIMAL(10,2),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_orders_orderNo_key" ON "payment_orders"("orderNo");
