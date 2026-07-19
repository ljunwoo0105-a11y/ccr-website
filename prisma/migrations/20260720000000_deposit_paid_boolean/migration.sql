-- RepairIntake.depositPaid: the amount was never used at the counter — staff
-- only record whether a deposit was taken. Any existing non-zero amount
-- becomes true so history keeps meaning "a deposit was paid".
ALTER TABLE "RepairIntake"
  ALTER COLUMN "depositPaid" DROP DEFAULT;

ALTER TABLE "RepairIntake"
  ALTER COLUMN "depositPaid" TYPE BOOLEAN
  USING (COALESCE("depositPaid", 0) > 0);

ALTER TABLE "RepairIntake"
  ALTER COLUMN "depositPaid" SET DEFAULT false;

UPDATE "RepairIntake" SET "depositPaid" = false WHERE "depositPaid" IS NULL;

ALTER TABLE "RepairIntake"
  ALTER COLUMN "depositPaid" SET NOT NULL;
