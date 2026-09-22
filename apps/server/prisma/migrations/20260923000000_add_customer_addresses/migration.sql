-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_bk" TEXT,
    "address" TEXT NOT NULL,
    "address_detail" TEXT NOT NULL,
    "geohash" TEXT NOT NULL DEFAULT '',
    "sex" INTEGER NOT NULL DEFAULT 1,
    "tag" TEXT NOT NULL DEFAULT '家',
    "tag_type" INTEGER NOT NULL DEFAULT 2,
    "poi_type" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_addresses_customer_id_idx" ON "customer_addresses"("customer_id");

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
