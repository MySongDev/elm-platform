CREATE TABLE "merchant_applications" (
    "id" TEXT NOT NULL,
    "merchant_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "business_category" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "materials" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "merchant_application_action_logs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
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

    CONSTRAINT "merchant_application_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "merchant_applications_status_idx" ON "merchant_applications"("status");
CREATE INDEX "merchant_applications_merchant_name_idx" ON "merchant_applications"("merchant_name");
CREATE INDEX "merchant_application_action_logs_application_id_idx" ON "merchant_application_action_logs"("application_id");

ALTER TABLE "merchant_application_action_logs"
ADD CONSTRAINT "merchant_application_action_logs_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "merchant_applications"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
