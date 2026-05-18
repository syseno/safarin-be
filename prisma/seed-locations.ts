import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing location data...');
  // We cannot easily delete cities/districts if they are referenced by masjids,
  // so we might need to disconnect them first or delete masjids if we are in a clean state.
  // Assuming we can clear masjids or just delete locations if safe.
  await prisma.masjid.updateMany({
    data: {
      cityId: null,
      districtId: null,
      subDistrictId: null,
    }
  });

  await prisma.subDistrict.deleteMany();
  await prisma.district.deleteMany();
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();

  console.log('Creating Indonesia...');
  const indonesia = await prisma.country.create({
    data: { name: 'Indonesia' },
  });

  console.log('Reading CSV...');
  const csvPath = path.join(__dirname, '../indonesia_address_data.csv');
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  
  const lines = csvData.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',');
  
  // Mapping parsed data
  const citiesMap = new Map<string, { id: string, name: string }>(); // city_id -> { uuid, name }
  const districtsMap = new Map<string, { id: string, name: string, cityId: string }>(); // dis_id -> { uuid, name, cityId }
  const subDistrictsMap = new Map<string, { id: string, name: string, districtId: string }>(); // subdis_id -> { uuid, name, districtId }

  console.log('Parsing data...');
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 10) continue;

    const subdis_id = cols[1];
    const dis_id = cols[2];
    const city_id = cols[3];
    const subdis_name = cols[6];
    const dis_name = cols[7];
    const city_name = cols[8];

    // Some CSVs might have quotes, but based on the preview, there are no quotes.

    if (!citiesMap.has(city_id)) {
      citiesMap.set(city_id, { id: crypto.randomUUID(), name: city_name });
    }

    if (!districtsMap.has(dis_id)) {
      const city = citiesMap.get(city_id);
      if (city) {
        districtsMap.set(dis_id, { id: crypto.randomUUID(), name: dis_name, cityId: city.id });
      }
    }

    if (!subDistrictsMap.has(subdis_id)) {
      const district = districtsMap.get(dis_id);
      if (district) {
        subDistrictsMap.set(subdis_id, { id: crypto.randomUUID(), name: subdis_name, districtId: district.id });
      }
    }
  }

  console.log(`Found ${citiesMap.size} cities, ${districtsMap.size} districts, ${subDistrictsMap.size} subdistricts.`);

  // Insert Cities
  console.log('Inserting Cities...');
  const citiesToInsert = Array.from(citiesMap.values()).map(c => ({ ...c, countryId: indonesia.id }));
  await prisma.city.createMany({ data: citiesToInsert });

  // Insert Districts (chunked)
  console.log('Inserting Districts...');
  const districtsToInsert = Array.from(districtsMap.values());
  for (let i = 0; i < districtsToInsert.length; i += 5000) {
    await prisma.district.createMany({ data: districtsToInsert.slice(i, i + 5000) });
  }

  // Insert SubDistricts (chunked)
  console.log('Inserting SubDistricts...');
  const subDistrictsToInsert = Array.from(subDistrictsMap.values());
  for (let i = 0; i < subDistrictsToInsert.length; i += 5000) {
    await prisma.subDistrict.createMany({ data: subDistrictsToInsert.slice(i, i + 5000) });
  }

  console.log('Location seeding completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
