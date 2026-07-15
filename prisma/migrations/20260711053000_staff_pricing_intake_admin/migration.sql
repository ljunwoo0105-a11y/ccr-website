-- AlterTable
ALTER TABLE "RepairIntake" ADD COLUMN "matchedPartId" TEXT;
ALTER TABLE "RepairIntake" ADD COLUMN "diagnosisRuleId" TEXT;
ALTER TABLE "RepairIntake" ADD COLUMN "diagnosisCode" TEXT;
ALTER TABLE "RepairIntake" ADD COLUMN "diagnosisLabel" TEXT;
ALTER TABLE "RepairIntake" ADD COLUMN "diagnosisOutcome" TEXT;
ALTER TABLE "RepairIntake" ADD COLUMN "pricingSource" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "RepairIntake" ADD COLUMN "agreementSnapshot" JSONB;
ALTER TABLE "RepairIntake" ADD COLUMN "policyAcknowledgements" JSONB;
ALTER TABLE "RepairIntake" ADD COLUMN "agreementAcceptedAt" TIMESTAMP(3);
ALTER TABLE "RepairIntake" ADD COLUMN "preConditionAccuracyAccepted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DiagnosisRule" (
    "id" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "symptomCode" TEXT NOT NULL,
    "symptomLabel" TEXT NOT NULL,
    "repairType" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDocument" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceType" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "symptomCode" TEXT,
    "outcome" TEXT NOT NULL,
    "matchedPartIds" JSONB NOT NULL,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepairIntake_matchedPartId_idx" ON "RepairIntake"("matchedPartId");

-- CreateIndex
CREATE INDEX "RepairIntake_diagnosisRuleId_idx" ON "RepairIntake"("diagnosisRuleId");

-- CreateIndex
CREATE INDEX "RepairIntake_agreementAcceptedAt_idx" ON "RepairIntake"("agreementAcceptedAt");

-- CreateIndex
CREATE INDEX "DiagnosisRule_deviceType_brand_model_active_idx" ON "DiagnosisRule"("deviceType", "brand", "model", "active");

-- CreateIndex
CREATE INDEX "DiagnosisRule_symptomCode_active_idx" ON "DiagnosisRule"("symptomCode", "active");

-- CreateIndex
CREATE INDEX "DiagnosisRule_repairType_active_idx" ON "DiagnosisRule"("repairType", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocument_category_version_key" ON "PolicyDocument"("category", "version");

-- CreateIndex
CREATE INDEX "PolicyDocument_category_active_idx" ON "PolicyDocument"("category", "active");

-- CreateIndex
CREATE INDEX "PriceAccessLog_createdAt_idx" ON "PriceAccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "PriceAccessLog_userId_createdAt_idx" ON "PriceAccessLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "RepairIntake" ADD CONSTRAINT "RepairIntake_matchedPartId_fkey" FOREIGN KEY ("matchedPartId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairIntake" ADD CONSTRAINT "RepairIntake_diagnosisRuleId_fkey" FOREIGN KEY ("diagnosisRuleId") REFERENCES "DiagnosisRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAccessLog" ADD CONSTRAINT "PriceAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
