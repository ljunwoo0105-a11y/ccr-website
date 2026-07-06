// One-off: give a few seeded screen parts colour variants so the in-store
// quote builder's colour step has real options to show. Idempotent-ish: it
// skips models that already have any coloured part. Safe to delete afterwards.
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // Target screen repairs (colour matters most for screens).
  const screens = await db.part.findMany({
    where: {
      active: true,
      repairType: { contains: "Screen" },
      colour: null,
    },
  });

  let updated = 0;
  let created = 0;
  const seenGroups = new Set();

  for (const p of screens) {
    const groupKey = `${p.deviceType}|${p.brand}|${p.model}|${p.repairType}|${p.quality}`;
    if (seenGroups.has(groupKey)) continue;
    seenGroups.add(groupKey);

    // Set the existing part to "Black" …
    await db.part.update({ where: { id: p.id }, data: { colour: "Black" } });
    updated++;

    // … and add a matching "White" variant at the same price.
    await db.part.create({
      data: {
        deviceType: p.deviceType,
        brand: p.brand,
        model: p.model,
        repairType: p.repairType,
        quality: p.quality,
        colour: "White",
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        warrantyDays: p.warrantyDays,
        stockQty: p.stockQty,
        supplier: p.supplier,
        notes: p.notes,
        active: true,
      },
    });
    created++;
  }

  console.log(`Colour variants: updated ${updated} parts to Black, created ${created} White variants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
