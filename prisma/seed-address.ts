/**
 * Seed Indonesian address data from indonesia_address_data.csv
 *
 * Maps CSV hierarchy to DB schema:
 *   prov_name  → Country  (Province used as top-level in the schema)
 *   city_name  → City
 *   dis_name   → District
 *   subdis_name → SubDistrict
 *
 * Uses batch inserts (createMany) for performance.
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CsvRow {
  prov_id: string;
  prov_name: string;
  city_id: string;
  city_name: string;
  dis_id: string;
  dis_name: string;
  subdis_id: string;
  subdis_name: string;
}

/** Parse CSV content into structured rows */
function parseCsv(content: string): CsvRow[] {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  // Skip header
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    // CSV columns: postal_id, subdis_id, dis_id, city_id, prov_id, postal_code, subdis_name, dis_name, city_name, prov_name
    if (cols.length < 10) continue;

    rows.push({
      prov_id: cols[4].trim(),
      prov_name: cols[9].trim(),
      city_id: cols[3].trim(),
      city_name: cols[8].trim(),
      dis_id: cols[2].trim(),
      dis_name: cols[7].trim(),
      subdis_id: cols[1].trim(),
      subdis_name: cols[6].trim(),
    });
  }

  return rows;
}

/** Batch insert helper — Prisma createMany has a limit, so we chunk */
async function batchCreateMany<T extends Record<string, unknown>>(
  model: { createMany: (args: { data: T[]; skipDuplicates?: boolean }) => Promise<unknown> },
  data: T[],
  batchSize = 1000
): Promise<void> {
  for (let i = 0; i < data.length; i += batchSize) {
    const chunk = data.slice(i, i + batchSize);
    await model.createMany({ data: chunk, skipDuplicates: true });
  }
}

async function main() {
  console.log('🗺️  Seeding Indonesian address data...\n');

  // ─── Read & Parse CSV ────────────────────────────────
  const csvPath = path.join(__dirname, '..', 'indonesia_address_data.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCsv(csvContent);
  console.log(`📄 Parsed ${rows.length.toLocaleString()} rows from CSV`);

  // ─── Extract unique entities using CSV numeric IDs ───
  const provMap = new Map<string, { csvId: string; name: string }>();
  const cityMap = new Map<string, { csvId: string; name: string; provId: string }>();
  const districtMap = new Map<string, { csvId: string; name: string; cityId: string }>();
  const subDistrictMap = new Map<string, { csvId: string; name: string; districtId: string }>();

  for (const row of rows) {
    if (!provMap.has(row.prov_id)) {
      provMap.set(row.prov_id, { csvId: row.prov_id, name: row.prov_name });
    }
    if (!cityMap.has(row.city_id)) {
      cityMap.set(row.city_id, { csvId: row.city_id, name: row.city_name, provId: row.prov_id });
    }
    if (!districtMap.has(row.dis_id)) {
      districtMap.set(row.dis_id, { csvId: row.dis_id, name: row.dis_name, cityId: row.city_id });
    }
    if (!subDistrictMap.has(row.subdis_id)) {
      subDistrictMap.set(row.subdis_id, { csvId: row.subdis_id, name: row.subdis_name, districtId: row.dis_id });
    }
  }

  console.log(`\n📊 Unique counts:`);
  console.log(`   Provinces:     ${provMap.size}`);
  console.log(`   Cities:        ${cityMap.size}`);
  console.log(`   Districts:     ${districtMap.size}`);
  console.log(`   Sub-Districts: ${subDistrictMap.size}`);

  // ─── Clean existing location data ────────────────────
  console.log('\n🧹 Cleaning existing location data...');
  // Must delete in reverse dependency order
  // First remove location refs from masjids
  await prisma.masjid.updateMany({
    data: { countryId: null, cityId: null, districtId: null, subDistrictId: null },
  });
  await prisma.subDistrict.deleteMany();
  await prisma.district.deleteMany();
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();
  console.log('   ✅ Cleaned');

  // ─── Insert Provinces → Country table ────────────────
  console.log('\n⏳ Inserting provinces...');
  const provDbMap = new Map<string, string>(); // csvId → dbId
  const provArray = Array.from(provMap.values());

  // Insert one by one to capture UUIDs (only 34)
  for (const prov of provArray) {
    const record = await prisma.country.create({ data: { name: prov.name } });
    provDbMap.set(prov.csvId, record.id);
  }
  console.log(`   ✅ ${provArray.length} provinces inserted`);

  // ─── Insert Cities ───────────────────────────────────
  console.log('⏳ Inserting cities...');
  const cityDbMap = new Map<string, string>(); // csvId → dbId
  const cityArray = Array.from(cityMap.values());

  // Cities ~500, insert one by one for UUID mapping
  for (const city of cityArray) {
    const countryId = provDbMap.get(city.provId);
    if (!countryId) continue;
    const record = await prisma.city.create({
      data: { name: city.name, countryId },
    });
    cityDbMap.set(city.csvId, record.id);
  }
  console.log(`   ✅ ${cityArray.length} cities inserted`);

  // ─── Insert Districts ────────────────────────────────
  console.log('⏳ Inserting districts...');
  const districtDbMap = new Map<string, string>(); // csvId → dbId
  const districtArray = Array.from(districtMap.values());

  // Districts ~7000, batch with individual creates for UUID capture
  let distCount = 0;
  for (const dist of districtArray) {
    const cityId = cityDbMap.get(dist.cityId);
    if (!cityId) continue;
    const record = await prisma.district.create({
      data: { name: dist.name, cityId },
    });
    districtDbMap.set(dist.csvId, record.id);
    distCount++;
    if (distCount % 1000 === 0) {
      console.log(`   ... ${distCount.toLocaleString()} districts`);
    }
  }
  console.log(`   ✅ ${distCount.toLocaleString()} districts inserted`);

  // ─── Insert SubDistricts (batch) ─────────────────────
  console.log('⏳ Inserting sub-districts (this may take a moment)...');
  const subDistArray = Array.from(subDistrictMap.values());

  // For subdistricts (~80K), use createMany for performance
  // We don't need UUID mapping back since nothing references subdistricts further
  const subDistData = subDistArray
    .map((sd) => {
      const districtId = districtDbMap.get(sd.districtId);
      if (!districtId) return null;
      return { name: sd.name, districtId };
    })
    .filter((d): d is { name: string; districtId: string } => d !== null);

  await batchCreateMany(prisma.subDistrict as never, subDistData as never[], 1000);
  console.log(`   ✅ ${subDistData.length.toLocaleString()} sub-districts inserted`);

  // ─── Summary ─────────────────────────────────────────
  console.log('\n🎉 Indonesian address data seeded successfully!');
  console.log(`   Total: ${provArray.length} provinces, ${cityArray.length} cities, ${distCount} districts, ${subDistData.length} sub-districts`);
}

main()
  .catch((e) => {
    console.error('❌ Address seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
