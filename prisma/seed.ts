import { PrismaClient, Role, FinanceType, InventoryCondition, DonationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.finance.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.event.deleteMany();
  await prisma.masjid.deleteMany();
  await prisma.user.deleteMany();
  // Location data is NOT cleaned — seeded separately by seed-address.ts

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── Location Data (lookup from CSV-seeded address data) ───
  const dkiJakarta = await prisma.country.findFirstOrThrow({ where: { name: 'DAERAH KHUSUS IBUKOTA JAKARTA' } });
  const jakartaPusat = await prisma.city.findFirstOrThrow({ where: { name: 'JAKARTA PUSAT', countryId: dkiJakarta.id } });
  const menteng = await prisma.district.findFirstOrThrow({ where: { name: 'MENTENG', cityId: jakartaPusat.id } });
  const pegangsaan = await prisma.subDistrict.findFirstOrThrow({ where: { name: 'PEGANGSAAN', districtId: menteng.id } });

  const jawaBarat = await prisma.country.findFirstOrThrow({ where: { name: 'JAWA BARAT' } });
  const bandung = await prisma.city.findFirstOrThrow({ where: { name: 'BANDUNG', countryId: jawaBarat.id } });
  const sumurbandung = await prisma.district.findFirstOrThrow({ where: { name: 'SUMUR BANDUNG', cityId: bandung.id } });
  const babakanciamis = await prisma.subDistrict.findFirstOrThrow({ where: { name: 'BABAKAN CIAMIS', districtId: sumurbandung.id } });

  // ─── Super Admin ───────────────────────────────────
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Administrator',
      email: 'admin@masjid.id',
      password: passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  // ─── Masjid Admin 1 ───────────────────────────────
  const takmirUser1 = await prisma.user.create({
    data: {
      name: 'Ahmad Fauzi',
      email: 'takmir1@masjid.id',
      password: passwordHash,
      role: Role.MASJID_ADMIN,
    },
  });

  const masjid1 = await prisma.masjid.create({
    data: {
      name: 'Masjid Al-Ikhlas',
      addressDetail: 'Jl. Merdeka No. 10',
      countryId: dkiJakarta.id,
      cityId: jakartaPusat.id,
      districtId: menteng.id,
      subDistrictId: pegangsaan.id,
      latitude: -6.1983,
      longitude: 106.8451,
      phone: '021-5551234',
      description: 'Masjid bersejarah di pusat kota Jakarta, didirikan tahun 1985.',
      verified: true,
      adminId: takmirUser1.id,
    },
  });
  console.log(`✅ Masjid 1: ${masjid1.name} (admin: ${takmirUser1.email})`);

  // ─── Masjid Admin 2 ───────────────────────────────
  const takmirUser2 = await prisma.user.create({
    data: {
      name: 'Muhammad Rizki',
      email: 'takmir2@masjid.id',
      password: passwordHash,
      role: Role.MASJID_ADMIN,
    },
  });

  const masjid2 = await prisma.masjid.create({
    data: {
      name: 'Masjid An-Nur',
      addressDetail: 'Jl. Sudirman No. 45',
      countryId: jawaBarat.id,
      cityId: bandung.id,
      districtId: sumurbandung.id,
      subDistrictId: babakanciamis.id,
      latitude: -6.9175,
      longitude: 107.6191,
      phone: '022-5559876',
      description: 'Masjid modern di jantung kota Bandung.',
      verified: false,
      adminId: takmirUser2.id,
    },
  });
  console.log(`✅ Masjid 2: ${masjid2.name} (admin: ${takmirUser2.email})`);

  // ─── Regular User ─────────────────────────────────
  await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'user@masjid.id',
      password: passwordHash,
      role: Role.USER,
    },
  });

  // ─── Inventory for Masjid 1 ───────────────────────
  const inv1 = await prisma.inventory.create({
    data: { name: 'Sajadah', quantity: 50, condition: InventoryCondition.GOOD, masjidId: masjid1.id },
  });
  const inv2 = await prisma.inventory.create({
    data: { name: 'Speaker TOA', quantity: 4, condition: InventoryCondition.GOOD, masjidId: masjid1.id },
  });
  await prisma.inventory.create({
    data: { name: 'AC Split 2PK', quantity: 6, condition: InventoryCondition.DAMAGED, masjidId: masjid1.id },
  });
  console.log('✅ Inventory seeded');

  // ─── Donations for Masjid 1 ───────────────────────
  const don1 = await prisma.donation.create({
    data: { type: DonationType.SADAQAH, amount: 5000000, description: 'Donasi dari Pak Haji Ahmad', masjidId: masjid1.id },
  });
  const don2 = await prisma.donation.create({
    data: { type: DonationType.INFAQ, amount: 2500000, description: 'Infaq Jumat Minggu ke-2', masjidId: masjid1.id },
  });
  await prisma.donation.create({
    data: { type: DonationType.ZAKAT, amount: 10000000, description: 'Zakat mal dari jamaah', masjidId: masjid1.id },
  });
  console.log('✅ Donations seeded');

  // ─── Finance Records for Masjid 1 ─────────────────
  await prisma.finance.create({
    data: {
      title: 'Donasi Sadaqah - Pak Haji Ahmad',
      amount: 5000000,
      type: FinanceType.DEBIT,
      description: 'Penerimaan donasi sadaqah',
      masjidId: masjid1.id,
      donationId: don1.id,
    },
  });
  await prisma.finance.create({
    data: {
      title: 'Infaq Jumat Minggu ke-2',
      amount: 2500000,
      type: FinanceType.DEBIT,
      description: 'Penerimaan infaq sholat jumat',
      masjidId: masjid1.id,
      donationId: don2.id,
    },
  });
  await prisma.finance.create({
    data: {
      title: 'Pembelian Sajadah Baru',
      amount: 1500000,
      type: FinanceType.CREDIT,
      description: 'Pembelian 10 sajadah baru untuk musholla',
      masjidId: masjid1.id,
      inventoryId: inv1.id,
    },
  });
  await prisma.finance.create({
    data: {
      title: 'Biaya Listrik Bulan Juni',
      amount: 800000,
      type: FinanceType.CREDIT,
      description: 'Pembayaran tagihan listrik',
      masjidId: masjid1.id,
    },
  });
  await prisma.finance.create({
    data: {
      title: 'Maintenance Speaker',
      amount: 350000,
      type: FinanceType.CREDIT,
      description: 'Perbaikan speaker TOA yang rusak',
      masjidId: masjid1.id,
      inventoryId: inv2.id,
    },
  });
  console.log('✅ Finance records seeded');

  // ─── Events for Masjid 1 ──────────────────────────
  const now = new Date();
  await prisma.event.createMany({
    data: [
      {
        title: 'Pengajian Akbar',
        description: 'Pengajian akbar bersama Ustadz Abdul Somad',
        date: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        startTime: '08:00',
        endTime: '12:00',
        location: 'Aula Utama Masjid',
        masjidId: masjid1.id,
      },
      {
        title: 'Buka Puasa Bersama',
        description: 'Buka puasa bersama jamaah dan warga sekitar',
        date: new Date(now.getFullYear(), now.getMonth() + 1, 20),
        startTime: '17:00',
        endTime: '19:30',
        location: 'Halaman Masjid',
        masjidId: masjid1.id,
      },
      {
        title: 'Kelas Tahfiz Anak',
        description: 'Kelas tahfiz Al-Quran untuk anak usia 7-12 tahun',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
        startTime: '14:00',
        endTime: '16:00',
        location: 'Ruang Kelas Lantai 2',
        masjidId: masjid1.id,
      },
    ],
  });
  console.log('✅ Events seeded');

  // ─── Dummy Masjid (Complete Attributes) ───────────────
  const dummyUser = await prisma.user.create({
    data: {
      name: 'Dummy Takmir',
      email: 'dummy@masjid.id',
      password: passwordHash,
      role: Role.MASJID_ADMIN,
    },
  });

  const dummyMasjid = await prisma.masjid.create({
    data: {
      name: 'Masjid Agung Dummy',
      addressDetail: 'Jl. Dummy Raya No. 99, Blok C',
      countryId: dkiJakarta.id,
      cityId: jakartaPusat.id,
      districtId: menteng.id,
      subDistrictId: pegangsaan.id,
      latitude: -6.2000,
      longitude: 106.8166,
      phone: '021-99998888',
      description: 'Masjid dummy dengan atribut lengkap untuk testing dan showcase UI/UX yang modern.',
      verified: true,
      skDkmUrl: 'dummy-sk-dkm.pdf',
      imageUrl: 'https://images.unsplash.com/photo-1564683214964-1601053b827e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      adminId: dummyUser.id,
    },
  });
  console.log(`✅ Dummy Masjid: ${dummyMasjid.name} (admin: ${dummyUser.email})`);

  // Inventory
  await prisma.inventory.create({
    data: { name: 'Mimbar Kayu Jati', quantity: 1, condition: InventoryCondition.GOOD, masjidId: dummyMasjid.id },
  });

  // Event
  await prisma.event.create({
    data: {
      title: 'Kajian Rutin Ahad Pagi',
      description: 'Kajian tematik membahas fikih muamalah',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      startTime: '08:00',
      endTime: '10:00',
      location: 'Ruang Utama Masjid Agung Dummy',
      masjidId: dummyMasjid.id,
    },
  });

  // Donation & Finance
  const dummyDon = await prisma.donation.create({
    data: { type: DonationType.ZAKAT, amount: 15000000, description: 'Zakat Hamba Allah', masjidId: dummyMasjid.id },
  });
  
  await prisma.finance.create({
    data: {
      title: 'Penerimaan Zakat Hamba Allah',
      amount: 15000000,
      type: FinanceType.DEBIT,
      description: 'Zakat mal via transfer bank',
      masjidId: dummyMasjid.id,
      donationId: dummyDon.id,
    },
  });

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('  Super Admin : admin@masjid.id / password123');
  console.log('  Takmir 1    : takmir1@masjid.id / password123');
  console.log('  Takmir 2    : takmir2@masjid.id / password123');
  console.log('  Dummy Takmir: dummy@masjid.id / password123');
  console.log('  User        : user@masjid.id / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
