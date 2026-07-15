import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const db = new PrismaClient();

const policyDocuments = [
  { id: "policy-terms-current", category: "TERMS", version: "2026-07-10.1", title: "Repair terms", body: "Customer authorises CCR to inspect and repair the device, accepts that further faults may be found during repair, and agrees that quoted work may require staff confirmation before parts are ordered.", active: true },
  { id: "policy-warranty-current", category: "WARRANTY", version: "2026-07-10.1", title: "Warranty policy", body: "Warranty applies to the specific repair and part supplied by CCR for the stated warranty period. Warranty excludes impact damage, liquid damage, unrelated faults, software issues, misuse, and customer-supplied parts.", active: true },
  { id: "policy-data-current", category: "DATA", version: "2026-07-10.1", title: "Data and device access", body: "Customer remains responsible for backing up data. CCR takes reasonable care but cannot guarantee data retention during diagnosis, repair, testing, software work, or device reset requests.", active: true },
] as const;

const diagnosisRules = [
  { id: "rule-phone-screen-cracked", deviceType: "Phone", brand: null, model: null, symptomCode: "screen-cracked", symptomLabel: "Cracked or damaged screen", repairType: "Screen Replacement", outcome: "PART", priority: 100, active: true },
  { id: "rule-phone-battery-service", deviceType: "Phone", brand: null, model: null, symptomCode: "battery-service", symptomLabel: "Battery drains quickly or needs service", repairType: "Battery Replacement", outcome: "PART", priority: 90, active: true },
  { id: "rule-phone-charging-port", deviceType: "Phone", brand: null, model: null, symptomCode: "charging-port", symptomLabel: "Charging port fault", repairType: "Charging Port Repair", outcome: "PART", priority: 80, active: true },
  { id: "rule-liquid-damage-inspection", deviceType: "Phone", brand: null, model: null, symptomCode: "liquid-damage", symptomLabel: "Liquid damage or corrosion", repairType: "Inspection", outcome: "INSPECTION", priority: 70, active: true },
  { id: "rule-phone-data-recovery", deviceType: "Phone", brand: null, model: null, symptomCode: "data-recovery", symptomLabel: "Data recovery assessment", repairType: "Data Recovery", outcome: "DATA_RECOVERY", priority: 65, active: true },
  { id: "rule-board-level-inspection", deviceType: "Computer", brand: null, model: null, symptomCode: "board-level", symptomLabel: "Board-level fault diagnosis", repairType: "Board-Level Repair", outcome: "MAINBOARD", priority: 60, active: true },
] as const;

function randomPassword(): string {
  return randomBytes(9).toString("base64url");
}

async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "coolcaserepair@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || randomPassword();
  const staffEmail = process.env.SEED_STAFF_EMAIL ?? "staff@ccr.local";
  const staffPassword = process.env.SEED_STAFF_PASSWORD || randomPassword();

  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "CCR Owner",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });
  await db.user.upsert({
    where: { email: staffEmail },
    update: {},
    create: {
      email: staffEmail,
      name: "Front Counter",
      role: "STAFF",
      passwordHash: await bcrypt.hash(staffPassword, 12),
    },
  });

  console.log(`Seeded users for ${adminEmail} and ${staffEmail}.`);
  console.log("Initial credentials are supplied by env or generated silently.");
}

async function seedAiModels() {
  const models = [
    { label: "Claude Fable 5", modelId: "claude-fable-5", inputPerMTok: 10, outputPerMTok: 50, notes: "Most capable tier" },
    { label: "Claude Opus 4.8", modelId: "claude-opus-4-8", inputPerMTok: 5, outputPerMTok: 25, notes: "Recommended default" },
    { label: "Claude Opus 4.7", modelId: "claude-opus-4-7", inputPerMTok: 5, outputPerMTok: 25, notes: null },
    { label: "Claude Opus 4.6", modelId: "claude-opus-4-6", inputPerMTok: 5, outputPerMTok: 25, notes: null },
    { label: "Claude Sonnet 4.6", modelId: "claude-sonnet-4-6", inputPerMTok: 3, outputPerMTok: 15, notes: "Speed/cost balance" },
    { label: "Claude Haiku 4.5", modelId: "claude-haiku-4-5", inputPerMTok: 1, outputPerMTok: 5, notes: "Cheapest, fastest" },
  ];
  for (const m of models) {
    await db.aiModel.upsert({
      where: { modelId: m.modelId },
      update: { inputPerMTok: m.inputPerMTok, outputPerMTok: m.outputPerMTok },
      create: m,
    });
  }
  console.log(`Seeded ${models.length} AI models.`);
}

async function seedSettings() {
  const defaults: Record<string, unknown> = {
    "ai.monthlyBudgetUsd": 50,
    "ai.blockAtCap": true,
    "ai.defaultPricingModel": "claude-opus-4-8",
    "ai.defaultResearchModel": "claude-opus-4-8",
    "pricing.targetMarginPct": 55,
    "google.rating": 4.9,
    "google.reviewCount": 1866,
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value) },
    });
  }
  console.log("Seeded settings.");
}

async function seedPolicyDocuments() {
  for (const policy of policyDocuments) {
    await db.$transaction([
      db.policyDocument.updateMany({
        where: {
          category: policy.category,
          version: { not: policy.version },
        },
        data: { active: false },
      }),
      db.policyDocument.upsert({
        where: {
          category_version: {
            category: policy.category,
            version: policy.version,
          },
        },
        update: {
          title: policy.title,
          body: policy.body,
          active: true,
        },
        create: policy,
      }),
    ]);
  }
  console.log(`Seeded ${policyDocuments.length} policy documents.`);
}

async function seedDiagnosisRules() {
  for (const rule of diagnosisRules) {
    await db.diagnosisRule.upsert({
      where: { id: rule.id },
      update: {
        deviceType: rule.deviceType,
        brand: rule.brand,
        model: rule.model,
        symptomCode: rule.symptomCode,
        symptomLabel: rule.symptomLabel,
        repairType: rule.repairType,
        outcome: rule.outcome,
        priority: rule.priority,
        active: rule.active,
      },
      create: rule,
    });
  }
  console.log(`Seeded ${diagnosisRules.length} diagnosis rules.`);
}

async function seedReviews() {
  const reviews = [
    { authorName: "Lee Lumayag", text: "They had everything that I needed.", rating: 5 },
    { authorName: "Matt Breakspear", text: "Easy and happy service", rating: 5 },
    { authorName: "George Jacob", text: "Great service", rating: 5 },
    { authorName: "Harley Baker", text: "Great", rating: 5 },
  ];
  for (const r of reviews) {
    const externalId = `seed-${r.authorName.toLowerCase().replace(/\s+/g, "-")}`;
    await db.review.upsert({
      where: { externalId },
      update: {},
      create: { ...r, source: "GOOGLE", externalId, visible: true },
    });
  }
  console.log(`Seeded ${reviews.length} reviews.`);
}

async function seedParts() {
  const count = await db.part.count();
  if (count > 0) {
    console.log("Parts already present; skipping sample catalog.");
    return;
  }

  type Tier = { quality: string; cost: number; sell: number; warranty: number };
  const screenTiers = (base: number): Tier[] => [
    { quality: "AFTERMARKET", cost: base * 0.35, sell: base, warranty: 90 },
    { quality: "PREMIUM", cost: base * 0.5, sell: Math.round(base * 1.35), warranty: 180 },
    { quality: "GENUINE", cost: base * 0.75, sell: Math.round(base * 1.9), warranty: 365 },
  ];
  const batteryTiers = (base: number): Tier[] => [
    { quality: "AFTERMARKET", cost: base * 0.35, sell: base, warranty: 90 },
    { quality: "PREMIUM", cost: base * 0.55, sell: Math.round(base * 1.3), warranty: 180 },
  ];

  const phones: Array<{ brand: string; model: string; screen: number; battery: number }> = [
    { brand: "Apple", model: "iPhone 11", screen: 99, battery: 79 },
    { brand: "Apple", model: "iPhone 12", screen: 119, battery: 89 },
    { brand: "Apple", model: "iPhone 13", screen: 139, battery: 99 },
    { brand: "Apple", model: "iPhone 14", screen: 179, battery: 109 },
    { brand: "Apple", model: "iPhone 15", screen: 219, battery: 119 },
    { brand: "Apple", model: "iPhone 15 Pro", screen: 289, battery: 129 },
    { brand: "Samsung", model: "Galaxy S21", screen: 189, battery: 99 },
    { brand: "Samsung", model: "Galaxy S22", screen: 219, battery: 109 },
    { brand: "Samsung", model: "Galaxy S23", screen: 259, battery: 119 },
    { brand: "Samsung", model: "Galaxy A54", screen: 149, battery: 89 },
    { brand: "Google", model: "Pixel 7", screen: 199, battery: 109 },
    { brand: "Google", model: "Pixel 8", screen: 239, battery: 119 },
    { brand: "OPPO", model: "A78", screen: 129, battery: 89 },
  ];

  const rows: Array<{
    deviceType: string; brand: string; model: string; repairType: string;
    quality: string; costPrice: number; sellPrice: number; warrantyDays: number; stockQty: number;
  }> = [];

  for (const p of phones) {
    for (const t of screenTiers(p.screen)) {
      rows.push({
        deviceType: "Phone", brand: p.brand, model: p.model,
        repairType: "Screen Replacement", quality: t.quality,
        costPrice: Math.round(t.cost), sellPrice: t.sell,
        warrantyDays: t.warranty, stockQty: 3,
      });
    }
    for (const t of batteryTiers(p.battery)) {
      rows.push({
        deviceType: "Phone", brand: p.brand, model: p.model,
        repairType: "Battery Replacement", quality: t.quality,
        costPrice: Math.round(t.cost), sellPrice: t.sell,
        warrantyDays: t.warranty, stockQty: 4,
      });
    }
    rows.push({
      deviceType: "Phone", brand: p.brand, model: p.model,
      repairType: "Charging Port Repair", quality: "PREMIUM",
      costPrice: Math.round(p.battery * 0.4), sellPrice: Math.round(p.battery * 1.2),
      warrantyDays: 180, stockQty: 2,
    });
  }

  rows.push(
    { deviceType: "Phone", brand: "Apple", model: "iPhone 13", repairType: "Back Glass Replacement", quality: "PREMIUM", costPrice: 45, sellPrice: 129, warrantyDays: 180, stockQty: 2 },
    { deviceType: "Phone", brand: "Apple", model: "iPhone 14", repairType: "Back Glass Replacement", quality: "PREMIUM", costPrice: 55, sellPrice: 149, warrantyDays: 180, stockQty: 2 },
    { deviceType: "Tablet", brand: "Apple", model: "iPad 9th Gen", repairType: "Screen Replacement", quality: "PREMIUM", costPrice: 65, sellPrice: 159, warrantyDays: 180, stockQty: 2 },
    { deviceType: "Tablet", brand: "Apple", model: "iPad Air 5", repairType: "Screen Replacement", quality: "PREMIUM", costPrice: 110, sellPrice: 249, warrantyDays: 180, stockQty: 1 },
    { deviceType: "Tablet", brand: "Samsung", model: "Galaxy Tab A8", repairType: "Screen Replacement", quality: "AFTERMARKET", costPrice: 55, sellPrice: 139, warrantyDays: 90, stockQty: 2 },
    { deviceType: "Watch", brand: "Apple", model: "Apple Watch Series 8", repairType: "Screen Replacement", quality: "PREMIUM", costPrice: 90, sellPrice: 219, warrantyDays: 90, stockQty: 1 },
    { deviceType: "Watch", brand: "Apple", model: "Apple Watch SE", repairType: "Battery Replacement", quality: "PREMIUM", costPrice: 35, sellPrice: 99, warrantyDays: 90, stockQty: 1 },
    { deviceType: "Computer", brand: "Apple", model: "MacBook Air M1", repairType: "Battery Replacement", quality: "OEM", costPrice: 95, sellPrice: 229, warrantyDays: 180, stockQty: 1 },
    { deviceType: "Computer", brand: "Generic", model: "Laptop (most models)", repairType: "SSD Upgrade 1TB", quality: "GENUINE", costPrice: 89, sellPrice: 199, warrantyDays: 365, stockQty: 5 },
    { deviceType: "Drone", brand: "DJI", model: "Mini 3 Pro", repairType: "Gimbal Repair", quality: "OEM", costPrice: 120, sellPrice: 289, warrantyDays: 90, stockQty: 1 }
  );

  await db.part.createMany({
    data: rows.map((r) => ({ ...r, notes: "Sample seed pricing; replace with real pricing" })),
  });
  console.log(`Seeded ${rows.length} sample parts.`);
}

async function main() {
  await seedUsers();
  await seedAiModels();
  await seedSettings();
  await seedPolicyDocuments();
  await seedDiagnosisRules();
  await seedReviews();
  await seedParts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
