ALTER TABLE "payment_orders"
  ADD COLUMN "fulfillment_status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  ADD COLUMN "refund_status" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN "refund_base_fulfillment_status" TEXT,
  ADD COLUMN "refund_reason" TEXT,
  ADD COLUMN "refund_reject_reason" TEXT,
  ADD COLUMN "accepted_at" TIMESTAMP(3),
  ADD COLUMN "preparing_at" TIMESTAMP(3),
  ADD COLUMN "delivering_at" TIMESTAMP(3),
  ADD COLUMN "completed_at" TIMESTAMP(3),
  ADD COLUMN "canceled_at" TIMESTAMP(3),
  ADD COLUMN "refund_requested_at" TIMESTAMP(3),
  ADD COLUMN "refunded_at" TIMESTAMP(3),
  ADD COLUMN "refund_rejected_at" TIMESTAMP(3);

UPDATE "payment_orders"
SET "fulfillment_status" = CASE
  WHEN "status" = 'PAID' THEN 'AWAITING_ACCEPTANCE'
  WHEN "status" = 'CLOSED' THEN 'CANCELED'
  ELSE 'PENDING_PAYMENT'
END
WHERE "fulfillment_status" = 'PENDING_PAYMENT';

CREATE TABLE "order_action_logs" (
  "id" SERIAL NOT NULL,
  "order_no" TEXT NOT NULL,
  "operator_id" TEXT NOT NULL,
  "operator_name" TEXT NOT NULL,
  "operator_type" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "from_fulfillment_status" TEXT,
  "to_fulfillment_status" TEXT,
  "from_refund_status" TEXT,
  "to_refund_status" TEXT,
  "reason" TEXT,
  "remark" TEXT,
  "request_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_action_logs_order_no_idx" ON "order_action_logs"("order_no");

ALTER TABLE "order_action_logs"
  ADD CONSTRAINT "order_action_logs_order_no_fkey"
  FOREIGN KEY ("order_no") REFERENCES "payment_orders"("orderNo")
  ON DELETE CASCADE ON UPDATE CASCADE;
