-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "role" TEXT NOT NULL DEFAULT 'user',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tenant_id" INTEGER,
    "data_scope" TEXT NOT NULL DEFAULT 'ALL',
    "bound_shop_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "plan_code" TEXT NOT NULL DEFAULT 'standard',
    "settings" JSONB,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_action_logs" (
    "id" SERIAL NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_users" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" SERIAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT,
    "shopName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tradeStatus" TEXT NOT NULL DEFAULT 'WAIT_BUYER_PAY',
    "fulfillment_status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "refund_status" TEXT NOT NULL DEFAULT 'NONE',
    "refund_base_fulfillment_status" TEXT,
    "refund_reason" TEXT,
    "refund_reject_reason" TEXT,
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
    "accepted_at" TIMESTAMP(3),
    "preparing_at" TIMESTAMP(3),
    "delivering_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "refund_requested_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "refund_rejected_at" TIMESTAMP(3),
    "tenant_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "tenant_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ip" TEXT,
    "address" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "remark" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL DEFAULT '',
    "name" TEXT,
    "icon" TEXT,
    "permission" TEXT,
    "type" TEXT NOT NULL DEFAULT 'menu',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depts" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "name" TEXT NOT NULL,
    "leader" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ip" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "tenant_id" INTEGER,
    "tenant_code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE INDEX "tenant_action_logs_tenant_id_idx" ON "tenant_action_logs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_users_phone_key" ON "customer_users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_orderNo_key" ON "payment_orders"("orderNo");

-- CreateIndex
CREATE INDEX "payment_orders_tenant_id_idx" ON "payment_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_orders_tenant_id_shopId_idx" ON "payment_orders"("tenant_id", "shopId");

-- CreateIndex
CREATE INDEX "order_action_logs_tenant_id_idx" ON "order_action_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "order_action_logs_order_no_idx" ON "order_action_logs"("order_no");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "operation_logs_tenant_id_idx" ON "operation_logs"("tenant_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_action_logs" ADD CONSTRAINT "tenant_action_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_action_logs" ADD CONSTRAINT "order_action_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_action_logs" ADD CONSTRAINT "order_action_logs_order_no_fkey" FOREIGN KEY ("order_no") REFERENCES "payment_orders"("orderNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depts" ADD CONSTRAINT "depts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "depts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
