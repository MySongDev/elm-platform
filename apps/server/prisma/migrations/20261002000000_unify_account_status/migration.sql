-- 统一「启用/禁用」类 status：Int(1/0) → String('ACTIVE'/'DISABLED')
-- 范围：users / customer_users / roles / menus / depts
-- 数据转换：1 → ACTIVE，其余（0 等）→ DISABLED，不丢数据。
-- 不涉及 login_logs / operation_logs / restaurants（成功失败/上游态，保持 INTEGER）。

-- users
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" SET DATA TYPE TEXT
  USING (CASE WHEN "status" = 1 THEN 'ACTIVE' ELSE 'DISABLED' END);
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- customer_users
ALTER TABLE "customer_users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "customer_users" ALTER COLUMN "status" SET DATA TYPE TEXT
  USING (CASE WHEN "status" = 1 THEN 'ACTIVE' ELSE 'DISABLED' END);
ALTER TABLE "customer_users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- roles
ALTER TABLE "roles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "roles" ALTER COLUMN "status" SET DATA TYPE TEXT
  USING (CASE WHEN "status" = 1 THEN 'ACTIVE' ELSE 'DISABLED' END);
ALTER TABLE "roles" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- menus
ALTER TABLE "menus" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "menus" ALTER COLUMN "status" SET DATA TYPE TEXT
  USING (CASE WHEN "status" = 1 THEN 'ACTIVE' ELSE 'DISABLED' END);
ALTER TABLE "menus" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- depts
ALTER TABLE "depts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "depts" ALTER COLUMN "status" SET DATA TYPE TEXT
  USING (CASE WHEN "status" = 1 THEN 'ACTIVE' ELSE 'DISABLED' END);
ALTER TABLE "depts" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
