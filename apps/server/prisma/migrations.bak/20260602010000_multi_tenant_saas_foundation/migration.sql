CREATE TABLE "tenants" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "contact_name" TEXT,
  "contact_phone" TEXT,
  "contact_email" TEXT,
  "plan_code" TEXT NOT NULL DEFAULT 'standard',
  "settings" JSONB,
  "remark" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "tenant_action_logs" (
  "id" SERIAL PRIMARY KEY,
  "tenant_id" INTEGER NOT NULL,
  "event" TEXT NOT NULL,
  "from_status" TEXT NOT NULL,
  "to_status" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_name" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "reason" TEXT,
  "remark" TEXT,
  "request_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "users" ADD COLUMN "tenant_id" INTEGER;
ALTER TABLE "users" ADD COLUMN "data_scope" TEXT NOT NULL DEFAULT 'ALL';
ALTER TABLE "users" ADD COLUMN "bound_shop_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "payment_orders" ADD COLUMN "tenant_id" INTEGER;
ALTER TABLE "order_action_logs" ADD COLUMN "tenant_id" INTEGER;
ALTER TABLE "operation_logs" ADD COLUMN "tenant_id" INTEGER;
ALTER TABLE "operation_logs" ADD COLUMN "tenant_code" TEXT;

ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_action_logs" ADD CONSTRAINT "order_action_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tenant_action_logs" ADD CONSTRAINT "tenant_action_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
CREATE INDEX "tenant_action_logs_tenant_id_idx" ON "tenant_action_logs"("tenant_id");
CREATE INDEX "payment_orders_tenant_id_idx" ON "payment_orders"("tenant_id");
CREATE INDEX "payment_orders_tenant_id_shop_id_idx" ON "payment_orders"("tenant_id", "shopId");
CREATE INDEX "order_action_logs_tenant_id_idx" ON "order_action_logs"("tenant_id");
CREATE INDEX "operation_logs_tenant_id_idx" ON "operation_logs"("tenant_id");
