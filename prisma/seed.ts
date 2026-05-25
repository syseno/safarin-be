import { PrismaClient, Role, FinanceType, InventoryCondition, DonationType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

  const diy = await prisma.country.findFirstOrThrow({ where: { name: 'DAERAH ISTIMEWA YOGYAKARTA' } });
  const sleman = await prisma.city.findFirstOrThrow({ where: { name: 'SLEMAN', countryId: diy.id } });
  const depokSleman = await prisma.district.findFirstOrThrow({ where: { name: 'DEPOK', cityId: sleman.id } });
  const caturtunggal = await prisma.subDistrict.findFirstOrThrow({ where: { name: 'CATUR TUNGGAL', districtId: depokSleman.id } });
  const condongcatur = await prisma.subDistrict.findFirstOrThrow({ where: { name: 'CONDONG CATUR', districtId: depokSleman.id } });

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

  // ─── Additional Verified Masjids for Location Testing ─────────────────
  const takmirAlFalah = await prisma.user.create({
    data: { name: 'Dedi Kurniadi', email: 'takmir.alfalah@masjid.id', password: passwordHash, role: Role.MASJID_ADMIN },
  });
  const masjidAlFalah = await prisma.masjid.create({
    data: {
      name: 'Masjid Al-Falah',
      addressDetail: 'Jl. Pegangsaan Barat No. 8',
      countryId: dkiJakarta.id,
      cityId: jakartaPusat.id,
      districtId: menteng.id,
      subDistrictId: pegangsaan.id,
      latitude: -6.1970,
      longitude: 106.8430,
      phone: '021-5558811',
      description: 'Masjid yang ramah dan aktif menyelenggarakan kajian keagamaan.',
      verified: true,
      adminId: takmirAlFalah.id,
    },
  });
  console.log(`✅ Masjid Al-Falah: ${masjidAlFalah.name} (admin: ${takmirAlFalah.email})`);

  const takmirBaiturrahman = await prisma.user.create({
    data: { name: 'Suryono', email: 'takmir.baiturrahman@masjid.id', password: passwordHash, role: Role.MASJID_ADMIN },
  });
  const masjidBaiturrahman = await prisma.masjid.create({
    data: {
      name: 'Masjid Baiturrahman',
      addressDetail: 'Jl. Pegangsaan Timur No. 12',
      countryId: dkiJakarta.id,
      cityId: jakartaPusat.id,
      districtId: menteng.id,
      subDistrictId: pegangsaan.id,
      latitude: -6.1995,
      longitude: 106.8475,
      phone: '021-5558822',
      description: 'Masjid yang sejuk dengan fasilitas DKM yang lengkap.',
      verified: true,
      adminId: takmirBaiturrahman.id,
    },
  });
  console.log(`✅ Masjid Baiturrahman: ${masjidBaiturrahman.name} (admin: ${takmirBaiturrahman.email})`);

  const takmirMatraman = await prisma.user.create({
    data: { name: 'Hidayat', email: 'takmir.matraman@masjid.id', password: passwordHash, role: Role.MASJID_ADMIN },
  });
  const masjidMatraman = await prisma.masjid.create({
    data: {
      name: 'Masjid Jami Matraman',
      addressDetail: 'Jl. Matraman Masjid No. 1',
      countryId: dkiJakarta.id,
      cityId: jakartaPusat.id,
      districtId: menteng.id,
      subDistrictId: pegangsaan.id,
      latitude: -6.2045,
      longitude: 106.8522,
      phone: '021-5558833',
      description: 'Masjid Jami bersejarah di kawasan Matraman.',
      verified: true,
      adminId: takmirMatraman.id,
    },
  });
  console.log(`✅ Masjid Jami Matraman: ${masjidMatraman.name} (admin: ${takmirMatraman.email})`);

  const takmirSundaKelapa = await prisma.user.create({
    data: { name: 'Faisal', email: 'takmir.sundakelapa@masjid.id', password: passwordHash, role: Role.MASJID_ADMIN },
  });
  const masjidSundaKelapa = await prisma.masjid.create({
    data: {
      name: 'Masjid Agung Sunda Kelapa',
      addressDetail: 'Jl. Taman Sunda Kelapa No. 16',
      countryId: dkiJakarta.id,
      cityId: jakartaPusat.id,
      districtId: menteng.id,
      subDistrictId: pegangsaan.id,
      latitude: -6.2023,
      longitude: 106.8331,
      phone: '021-5558844',
      description: 'Masjid Agung bersejarah dengan aristektur tanpa kubah yang ikonik.',
      verified: true,
      adminId: takmirSundaKelapa.id,
    },
  });
  console.log(`✅ Masjid Agung Sunda Kelapa: ${masjidSundaKelapa.name} (admin: ${takmirSundaKelapa.email})`);

  // ─── Yogyakarta/Sleman Proximity Masjids ─────────────────
  const takmirSleman1 = await prisma.user.create({
    data: { name: 'Takmir Al Ikhlas', email: 'takmir.sleman1@masjid.id', password: passwordHash, role: Role.MASJID_ADMIN },
  });
  const masjidSleman1 = await prisma.masjid.create({
    data: {
      name: 'Masjid Al Ikhlas',
      addressDetail: 'Jl. Kaliurang KM 5.5, Sleman, DI Yogyakarta',
      countryId: diy.id,
      cityId: sleman.id,
      districtId: depokSleman.id,
      subDistrictId: caturtunggal.id,
      latitude: -7.690921,
      longitude: 110.334102,
      phone: '0812-3456-001',
      description: 'Masjid Al Ikhlas di Jl. Kaliurang KM 5.5, dekat dengan berbagai fasilitas mahasiswa.',
      verified: true,
      adminId: takmirSleman1.id,
    },
  });
  console.log(`✅ Masjid Sleman 1: ${masjidSleman1.name} (admin: ${takmirSleman1.email})`);

  const takmirSleman2 = await prisma.user.create({
    data: { name: 'Takmir Nurul Huda', email: 'takmir.sleman2@masjid.id', password: passwordHash, role: Role.MASJID_ADMIN },
  });
  const masjidSleman2 = await prisma.masjid.create({
    data: {
      name: 'Masjid Nurul Huda',
      addressDetail: 'Jl. Selokan Mataram, Depok, Sleman',
      countryId: diy.id,
      cityId: sleman.id,
      districtId: depokSleman.id,
      subDistrictId: caturtunggal.id,
      latitude: -7.692145,
      longitude: 110.336011,
      phone: '0812-3456-002',
      description: 'Masjid Nurul Huda di Selokan Mataram, tempat ibadah yang nyaman bagi warga sekitar.',
      verified: true,
      adminId: takmirSleman2.id,
    },
  });
  console.log(`✅ Masjid Sleman 2: ${masjidSleman2.name} (admin: ${takmirSleman2.email})`);

  const takmirSleman3 = await prisma.user.create({
    data: { name: 'Takmir Al Falah', email: 'takmir.sleman3@masjid.id', password: passwordHash, role: Role.MASJID_ADMIN },
  });
  const masjidSleman3 = await prisma.masjid.create({
    data: {
      name: 'Masjid Al Falah',
      addressDetail: 'Jl. Gejayan Gang Melati, Sleman',
      countryId: diy.id,
      cityId: sleman.id,
      districtId: depokSleman.id,
      subDistrictId: condongcatur.id,
      latitude: -7.688992,
      longitude: 110.333488,
      phone: '0812-3456-003',
      description: 'Masjid Al Falah di Jl. Gejayan, menyelenggarakan berbagai kegiatan remaja masjid.',
      verified: true,
      adminId: takmirSleman3.id,
    },
  });
  console.log(`✅ Masjid Sleman 3: ${masjidSleman3.name} (admin: ${takmirSleman3.email})`);

  const takmirSleman4 = await prisma.user.create({
    data: { name: 'Takmir Baiturrahman', email: 'takmir.sleman4@masjid.id', password: passwordHash, role: Role.MASJID_ADMIN },
  });
  const masjidSleman4 = await prisma.masjid.create({
    data: {
      name: 'Masjid Baiturrahman',
      addressDetail: 'Jl. Cempaka Baru No.12, Sleman',
      countryId: diy.id,
      cityId: sleman.id,
      districtId: depokSleman.id,
      subDistrictId: caturtunggal.id,
      latitude: -7.694210,
      longitude: 110.337201,
      phone: '0812-3456-004',
      description: 'Masjid Baiturrahman di Cempaka Baru, memiliki lingkungan yang teduh dan asri.',
      verified: true,
      adminId: takmirSleman4.id,
    },
  });
  console.log(`✅ Masjid Sleman 4: ${masjidSleman4.name} (admin: ${takmirSleman4.email})`);

  const takmirSleman5 = await prisma.user.create({
    data: { name: 'Takmir At Taqwa', email: 'takmir.sleman5@masjid.id', password: passwordHash, role: Role.MASJID_ADMIN },
  });
  const masjidSleman5 = await prisma.masjid.create({
    data: {
      name: 'Masjid At Taqwa',
      addressDetail: 'Jl. Anggrek Raya, Condongcatur, Sleman',
      countryId: diy.id,
      cityId: sleman.id,
      districtId: depokSleman.id,
      subDistrictId: condongcatur.id,
      latitude: -7.687880,
      longitude: 110.331944,
      phone: '0812-3456-005',
      description: 'Masjid At Taqwa di Condongcatur, aktif memakmurkan masjid dengan kajian rutin.',
      verified: true,
      adminId: takmirSleman5.id,
    },
  });
  console.log(`✅ Masjid Sleman 5: ${masjidSleman5.name} (admin: ${takmirSleman5.email})`);

  // ─── Regular User ─────────────────────────────────
  await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'user@masjid.id',
      password: passwordHash,
      role: Role.USER,
    },
  });

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

  // ─── Populate All Masjids with Inventories, Donations, Finances, and Events ───
  const allMasjids = [
    masjid1,
    masjid2,
    masjidAlFalah,
    masjidBaiturrahman,
    masjidMatraman,
    masjidSundaKelapa,
    masjidSleman1,
    masjidSleman2,
    masjidSleman3,
    masjidSleman4,
    masjidSleman5,
    dummyMasjid,
  ];

  const now = new Date();

  for (const masjid of allMasjids) {
    console.log(`⏳ Seeding relations for ${masjid.name}...`);

    // 1. Inventories
    const quranInv = await prisma.inventory.create({
      data: { name: 'Al-Qur\'an Terjemah', quantity: 100, condition: InventoryCondition.GOOD, masjidId: masjid.id },
    });
    const acInv = await prisma.inventory.create({
      data: { name: 'AC Split 2PK', quantity: 4, condition: InventoryCondition.GOOD, masjidId: masjid.id },
    });
    const speakerInv = await prisma.inventory.create({
      data: { name: 'Sound System TOA', quantity: 2, condition: InventoryCondition.GOOD, masjidId: masjid.id },
    });
    const sajadahInv = await prisma.inventory.create({
      data: { name: 'Sajadah Imam', quantity: 2, condition: InventoryCondition.GOOD, masjidId: masjid.id },
    });
    const fanInv = await prisma.inventory.create({
      data: { name: 'Kipas Angin Dinding', quantity: 6, condition: InventoryCondition.GOOD, masjidId: masjid.id },
    });

    // 2. Donations
    const donZakat = await prisma.donation.create({
      data: { type: DonationType.ZAKAT, amount: 7500000, description: 'Zakat maal hamba Allah', masjidId: masjid.id },
    });
    const donInfaq = await prisma.donation.create({
      data: { type: DonationType.INFAQ, amount: 3200000, description: 'Infaq kotak amal shalat Jumat', masjidId: masjid.id },
    });
    const donSadaqah = await prisma.donation.create({
      data: { type: DonationType.SADAQAH, amount: 1800000, description: 'Sadaqah pembangunan tempat wudhu', masjidId: masjid.id },
    });

    // 3. Finances
    // DEBIT 1 (Zakat)
    await prisma.finance.create({
      data: {
        title: 'Penerimaan Zakat Maal',
        amount: 7500000,
        type: FinanceType.DEBIT,
        description: 'Zakat maal tahunan dari jamaah',
        masjidId: masjid.id,
        donationId: donZakat.id,
      },
    });

    // DEBIT 2 (Infaq)
    await prisma.finance.create({
      data: {
        title: 'Penerimaan Infaq Jum\'at',
        amount: 3200000,
        type: FinanceType.DEBIT,
        description: 'Kotak amal shalat Jum\'at mingguan',
        masjidId: masjid.id,
        donationId: donInfaq.id,
      },
    });

    // DEBIT 3 (Sadaqah)
    await prisma.finance.create({
      data: {
        title: 'Sadaqah Renovasi Tempat Wudhu',
        amount: 1800000,
        type: FinanceType.DEBIT,
        description: 'Sadaqah tunai dari jamaah untuk renovasi wudhu',
        masjidId: masjid.id,
        donationId: donSadaqah.id,
      },
    });

    // CREDIT 1 (Purchase Al-Qur'an - Linked to Inventory)
    await prisma.finance.create({
      data: {
        title: 'Pembelian Mushaf Al-Qur\'an Baru',
        amount: 1200000,
        type: FinanceType.CREDIT,
        description: 'Pembelian 20 mushaf Al-Qur\'an baru untuk jamaah',
        masjidId: masjid.id,
        inventoryId: quranInv.id,
      },
    });

    // CREDIT 2 (AC Service - Linked to Inventory)
    await prisma.finance.create({
      data: {
        title: 'Perbaikan AC Ruang Shalat Utama',
        amount: 450000,
        type: FinanceType.CREDIT,
        description: 'Servis rutin cuci AC dan isi freon',
        masjidId: masjid.id,
        inventoryId: acInv.id,
      },
    });

    // CREDIT 3 (PLN Power Bill - Operational, no inventory)
    await prisma.finance.create({
      data: {
        title: 'Pembayaran Tagihan Listrik PLN',
        amount: 900000,
        type: FinanceType.CREDIT,
        description: 'Pembayaran rekening listrik PLN pascabayar',
        masjidId: masjid.id,
      },
    });

    // CREDIT 4 (PDAM Water Bill - Operational, no inventory)
    await prisma.finance.create({
      data: {
        title: 'Pembayaran Tagihan Air PDAM',
        amount: 350000,
        type: FinanceType.CREDIT,
        description: 'Pembayaran air bersih tempat wudhu bulanan',
        masjidId: masjid.id,
      },
    });

    // 4. Events
    // Event 1: Past Event
    await prisma.event.create({
      data: {
        title: 'Kajian Fiqih Shalat & Ibadah',
        description: `Kajian fikih shalat berjamaah dan bersuci bersama narasumber ahli di ${masjid.name}`,
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        startTime: '09:00',
        endTime: '11:30',
        location: 'Aula Utama Masjid',
        imageUrl: "https://images.unsplash.com/photo-1564683214964-1601053b827e?auto=format&fit=crop&w=800&q=80",
        masjidId: masjid.id,
      },
    });

    // Event 2: Recurring Wednesday Event - Kajian Tafsir Al-Qur'an Rutin
    const datesTafsir: Date[] = [];
    const startTafsir = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
    let currentTafsir = new Date(startTafsir);
    while (currentTafsir.getDay() !== 3) { // 3 is Wednesday
      currentTafsir.setDate(currentTafsir.getDate() + 1);
    }
    for (let i = 0; i < 30; i++) {
      datesTafsir.push(new Date(currentTafsir));
      currentTafsir.setDate(currentTafsir.getDate() + 7);
    }
    const groupIdTafsir = crypto.randomUUID();
    await prisma.event.createMany({
      data: datesTafsir.map(d => ({
        title: "Kajian Tafsir Al-Qur'an Rutin",
        description: `Tafsir tematik pekanan untuk memperdalam pemahaman kitab suci di ${masjid.name}. Terbuka untuk umum.`,
        date: d,
        startTime: '18:30',
        endTime: '20:00',
        location: 'Ruang Shalat Utama',
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
        groupId: groupIdTafsir,
        isException: false,
        recurrenceType: 'WEEKLY',
        recurrenceInterval: 1,
        recurrenceDays: '3',
        masjidId: masjid.id,
      }))
    });

    // Event 3: Recurring Mon/Thu Event - Buka Puasa Senin-Kamis Bersama
    const datesSK: Date[] = [];
    const startSK = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
    let currentSK = new Date(startSK);
    while (datesSK.length < 30) {
      if (currentSK.getDay() === 1 || currentSK.getDay() === 4) { // Monday (1) or Thursday (4)
        datesSK.push(new Date(currentSK));
      }
      currentSK.setDate(currentSK.getDate() + 1);
    }
    const groupIdSK = crypto.randomUUID();
    await prisma.event.createMany({
      data: datesSK.map(d => ({
        title: "Buka Puasa Senin-Kamis Bersama",
        description: `Kegiatan rutin buka puasa bersama jamaah ${masjid.name} setiap hari Senin dan Kamis. Menyediakan ta'jil dan hidangan berbuka gratis.`,
        date: d,
        startTime: '17:00',
        endTime: '19:00',
        location: 'Serambi Masjid',
        imageUrl: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80",
        groupId: groupIdSK,
        isException: false,
        recurrenceType: 'WEEKLY',
        recurrenceInterval: 1,
        recurrenceDays: '1,4',
        masjidId: masjid.id,
      }))
    });

    // Event 4: Future One-off Event
    await prisma.event.create({
      data: {
        title: 'Tabligh Akbar & Santunan Anak Yatim',
        description: `Tabligh akbar bertema kepedulian sosial dan pemberian santunan di lingkungan ${masjid.name}`,
        date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days in future
        startTime: '13:00',
        endTime: '15:30',
        location: 'Halaman Utama Masjid',
        imageUrl: "https://images.unsplash.com/photo-1576489922094-2cfe89f1a23b?auto=format&fit=crop&w=800&q=80",
        masjidId: masjid.id,
      },
    });

    console.log(`✅ Seeded all relations for ${masjid.name}`);
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('  Super Admin : admin@masjid.id / password123');
  console.log('  Takmir 1    : takmir1@masjid.id / password123');
  console.log('  Takmir 2    : takmir2@masjid.id / password123');
  console.log('  Dummy Takmir: dummy@masjid.id / password123');
  console.log('  User        : user@masjid.id / password123');
  console.log('  Takmir Sleman 1: takmir.sleman1@masjid.id / password123');
  console.log('  Takmir Sleman 2: takmir.sleman2@masjid.id / password123');
  console.log('  Takmir Sleman 3: takmir.sleman3@masjid.id / password123');
  console.log('  Takmir Sleman 4: takmir.sleman4@masjid.id / password123');
  console.log('  Takmir Sleman 5: takmir.sleman5@masjid.id / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
