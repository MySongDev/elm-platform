-- CreateTable
CREATE TABLE "restaurants" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" DOUBLE PRECISION[],
    "phone" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "status" INTEGER NOT NULL DEFAULT 1,
    "recent_order_num" INTEGER NOT NULL,
    "rating_count" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "promotion_info" TEXT NOT NULL DEFAULT '',
    "opening_hours" TEXT[],
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "image_path" TEXT NOT NULL DEFAULT '',
    "float_minimum_order_amount" DOUBLE PRECISION NOT NULL,
    "float_delivery_fee" DOUBLE PRECISION NOT NULL,
    "order_lead_time" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "supports" JSONB NOT NULL DEFAULT '[]',
    "activities" JSONB NOT NULL DEFAULT '[]',
    "piecewise_agent_fee" JSONB NOT NULL DEFAULT '{}',
    "license" JSONB NOT NULL DEFAULT '{}',
    "identification" JSONB NOT NULL DEFAULT '{}',
    "delivery_mode" JSONB,
    "tenant_id" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'upstream',
    "menu_synced_at" TIMESTAMP(3),
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_categories" (
    "id" INTEGER NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" INTEGER NOT NULL,
    "icon_url" TEXT NOT NULL DEFAULT '',
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "food_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "item_id" INTEGER NOT NULL,
    "_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "image_path" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "tips" TEXT NOT NULL DEFAULT '',
    "month_sales" INTEGER NOT NULL,
    "satisfy_rate" INTEGER NOT NULL,
    "satisfy_count" INTEGER NOT NULL,
    "rating_count" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "activity" JSONB,
    "attributes" JSONB NOT NULL DEFAULT '[]',
    "specifications" JSONB NOT NULL DEFAULT '[]',
    "specfoods" JSONB NOT NULL DEFAULT '[]',
    "tenant_id" INTEGER,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "foods_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "category_entries" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "is_in_serving" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT NOT NULL DEFAULT '',
    "icon_url" TEXT NOT NULL DEFAULT '',
    "title_color" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "category_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restaurants_tenant_id_idx" ON "restaurants"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurants_name_idx" ON "restaurants"("name");

-- CreateIndex
CREATE INDEX "food_categories_restaurant_id_idx" ON "food_categories"("restaurant_id");

-- CreateIndex
CREATE INDEX "foods_restaurant_id_idx" ON "foods"("restaurant_id");

-- CreateIndex
CREATE INDEX "foods_category_id_idx" ON "foods"("category_id");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_categories" ADD CONSTRAINT "food_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "food_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
