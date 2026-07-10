-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "repairType" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "colour" TEXT,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "warrantyDays" INTEGER NOT NULL DEFAULT 90,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "supplier" TEXT,
    "posItemId" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "referralSource" TEXT NOT NULL,
    "referralOther" TEXT,
    "deviceType" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "repairType" TEXT NOT NULL,
    "issueNotes" TEXT,
    "fromPriceAud" DOUBLE PRECISION,
    "partQuality" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "emailedAt" TIMESTAMP(3),
    "emailError" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "suburb" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairIntake" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "imei" TEXT,
    "serialNo" TEXT,
    "repairTypes" TEXT NOT NULL,
    "preCondition" TEXT NOT NULL,
    "accessories" TEXT,
    "conditionNotes" TEXT,
    "partQuality" TEXT,
    "warrantyDays" INTEGER,
    "quotedPrice" DOUBLE PRECISION,
    "depositPaid" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'CHECKED_IN',
    "customerSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RepairIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairForm" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "deviceType" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "preCondition" TEXT,
    "conditionNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUOTED',
    "emailedAt" TIMESTAMP(3),
    "emailError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairFormItem" (
    "id" TEXT NOT NULL,
    "repairFormId" TEXT NOT NULL,
    "repairType" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "colour" TEXT,
    "partId" TEXT,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "warrantyDays" INTEGER,

    CONSTRAINT "RepairFormItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputPerMTok" DOUBLE PRECISION NOT NULL,
    "outputPerMTok" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Part_brand_model_repairType_idx" ON "Part"("brand", "model", "repairType");

-- CreateIndex
CREATE INDEX "Part_posItemId_idx" ON "Part"("posItemId");

-- CreateIndex
CREATE INDEX "QuoteRequest_email_idx" ON "QuoteRequest"("email");

-- CreateIndex
CREATE INDEX "QuoteRequest_createdAt_idx" ON "QuoteRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "RepairIntake_status_idx" ON "RepairIntake"("status");

-- CreateIndex
CREATE INDEX "RepairIntake_customerId_idx" ON "RepairIntake"("customerId");

-- CreateIndex
CREATE INDEX "RepairForm_createdAt_idx" ON "RepairForm"("createdAt");

-- CreateIndex
CREATE INDEX "RepairForm_customerEmail_idx" ON "RepairForm"("customerEmail");

-- CreateIndex
CREATE INDEX "RepairFormItem_repairFormId_idx" ON "RepairFormItem"("repairFormId");

-- CreateIndex
CREATE INDEX "RepairFormItem_partId_idx" ON "RepairFormItem"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_externalId_key" ON "Review"("externalId");

-- CreateIndex
CREATE INDEX "Review_rating_visible_idx" ON "Review"("rating", "visible");

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_modelId_key" ON "AiModel"("modelId");

-- CreateIndex
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_feature_idx" ON "AiUsageLog"("feature");

-- AddForeignKey
ALTER TABLE "RepairIntake" ADD CONSTRAINT "RepairIntake_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairIntake" ADD CONSTRAINT "RepairIntake_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairForm" ADD CONSTRAINT "RepairForm_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairFormItem" ADD CONSTRAINT "RepairFormItem_repairFormId_fkey" FOREIGN KEY ("repairFormId") REFERENCES "RepairForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairFormItem" ADD CONSTRAINT "RepairFormItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;