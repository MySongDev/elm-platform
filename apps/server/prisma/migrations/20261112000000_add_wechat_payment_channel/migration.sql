ALTER TABLE "payment_orders"
ADD COLUMN "payment_channel" TEXT,
ADD COLUMN "checkout_request_key" TEXT;

CREATE UNIQUE INDEX "payment_orders_checkout_request_key_key"
ON "payment_orders"("checkout_request_key");
