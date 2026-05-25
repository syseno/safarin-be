import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Querying provinces containing YOGYAKARTA...');
  const provinces = await prisma.country.findMany({
    where: { name: { contains: 'YOGYAKARTA', mode: 'insensitive' } }
  });
  console.log('Provinces:', provinces);

  if (provinces.length > 0) {
    const provId = provinces[0].id;
    console.log('Querying cities in province:', provinces[0].name);
    const cities = await prisma.city.findMany({
      where: { countryId: provId }
    });
    console.log('Cities:', cities);

    const sleman = cities.find(c => c.name.includes('SLEMAN'));
    if (sleman) {
      console.log('Querying districts in Sleman...');
      const districts = await prisma.district.findMany({
        where: { cityId: sleman.id }
      });
      console.log('Districts:', districts.map(d => d.name));

      const depok = districts.find(d => d.name.includes('DEPOK'));
      if (depok) {
        console.log('Querying subdistricts in Depok, Sleman...');
        const subDistricts = await prisma.subDistrict.findMany({
          where: { districtId: depok.id }
        });
        console.log('Subdistricts:', subDistricts.map(sd => sd.name));
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
