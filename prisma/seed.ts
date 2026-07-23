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
  // Boot-loop / short-cycle reboot family. Sources verified 2026-07: iFixit
  // kernel-panics wiki + hardware-isolation guide, repair.wiki panic-log guide,
  // Rossmann boot-loop service page, iPad Rehab, VCC Board Repairs panic list.
  // Full triage reference: docs/boot-loop-diagnostics.md
  { id: "rule-phone-boot-loop-triage", deviceType: "Phone", brand: null, model: null, symptomCode: "boot-loop", symptomLabel: "Boot loop — restarts seconds after logo", repairType: "Inspection", outcome: "INSPECTION", priority: 85, active: true, notes: "Two signatures. (a) Runs ~3 min then restarts = missing-sensor watchdog panic — read the panic-full log first (Settings > Privacy (& Security) > Analytics & Improvements > Analytics Data). (b) Restarts seconds after logo = short/PMIC/NAND class. DC supply: software loop ramps ~0.07-0.19A, holds 20-30s, drops, repeats; sustained high draw with no cycling = short (board-level). Isolation: disconnect all, boot minimal, reconnect one part at a time with battery disconnected between; use known-good battery/dock/power flex. Post-X iPhones deliberately reboot after ~3 min while sensor parts are disconnected — not a fault. Full guide: docs/boot-loop-diagnostics.md" },
  { id: "rule-iphone-3min-sensor-reboot", deviceType: "Phone", brand: "Apple", model: null, symptomCode: "reboot-3min-sensor", symptomLabel: "Runs ~3 min then restarts (sensor panic)", repairType: "Charging Port Repair", outcome: "PART", priority: 84, active: true, notes: "Boots to lock screen, runs ~3 min, restarts. Panic-full log: Prs0 or Mic1 = dock flex (most common cause is an aftermarket flex missing the barometer — fit a quality part); Mic2/REARMIC2 = power-button flex (esp. after back-glass work, iPhone 11 series); SE 2020 Mic1 can be a board trace under the SIM tray. iPhone 13+ hex codes: 13: 0x800 dock / 0x1000 prox flex (0x1800 both); 14 Pro: 0x40000 dock / 0x80000 prox; 15 Pro: 0x300000 dock / 0xa1 battery; all 13+: 0x20 charging circuit, 0x40 gas gauge, 0x400000 wireless coil." },
  { id: "rule-iphone-panic-battery-sensor", deviceType: "Phone", brand: "Apple", model: null, symptomCode: "panic-tg0b-battery", symptomLabel: "Panic log: TG0B / TG0V (battery sensor)", repairType: "Battery Replacement", outcome: "PART", priority: 83, active: true, notes: "TG0B/TG0V = battery temp/voltage sensor missing: battery, battery connector, battery data line or charging circuitry. On 11 Pro / Pro Max the battery data line routes through the dock flex — try that flex too if a new battery doesn't clear the panic." },
  { id: "rule-iphone-panic-nand", deviceType: "Phone", brand: "Apple", model: null, symptomCode: "panic-ans2-nand", symptomLabel: "Panic log: ANS2 (NAND / storage)", repairType: "Board-Level Repair", outcome: "MAINBOARD", priority: 82, active: true, notes: "ANS2 = NAND/storage class. Board-level; AU shops quote per device (typically $150-$350, up to $500). If the customer needs their data and the phone won't boot, offer the data-recovery path (~$300-$400+)." },
  { id: "rule-phone-boot-loop-after-repair", deviceType: "Phone", brand: null, model: null, symptomCode: "boot-loop-after-repair", symptomLabel: "Boot loop right after a screen/flex repair", repairType: "Inspection", outcome: "INSPECTION", priority: 81, active: true, notes: "Boot loop straight after screen/flex/back-glass work usually means a bent FPC connector pin or a damaged sensor flex (earpiece/prox, front camera). Reseat every flex touched during the job, inspect FPC pins under magnification, then run the isolation procedure (battery disconnected between reconnects)." },
  { id: "rule-iphone-audio-panic-dock", deviceType: "Phone", brand: "Apple", model: null, symptomCode: "panic-aop-bosch", symptomLabel: "Panic log: AOP / Bosch write failure", repairType: "Charging Port Repair", outcome: "PART", priority: 80, active: true, notes: "'AOP Panic - K2 - Bosch control channel write failure' = dock flex (the Bosch barometer lives on that flex); classically triggers during loud audio playback. Replace with a quality dock flex assembly." },
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
