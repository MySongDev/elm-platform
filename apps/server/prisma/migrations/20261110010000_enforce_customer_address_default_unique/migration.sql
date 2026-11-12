BEGIN;

-- 预检与建索引期间阻止地址写入；发现历史双默认时停止，不替用户挑选或清除默认。
LOCK TABLE "customer_addresses" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "customer_addresses"
    WHERE "is_default" = true
    GROUP BY "customer_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION '存在同用户多个默认地址，请确认修复数据后再应用默认唯一索引';
  END IF;
END;
$$;

CREATE UNIQUE INDEX "customer_addresses_one_default_per_customer"
ON "customer_addresses" ("customer_id") WHERE "is_default" = true;

COMMIT;
