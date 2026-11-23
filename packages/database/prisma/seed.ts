import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient, CourtType, DayType, CanteenCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Auto-load root .env atau database .env
const envPaths = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    try {
      process.loadEnvFile(p);
      break;
    } catch {}
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database Futsal SaaS...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Tenant Utama
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'championfutsal' },
    update: {},
    create: {
      businessName: 'Champion Futsal Group',
      subdomain: 'championfutsal',
      ownerName: 'Budi Cahyono',
      ownerPhone: '081234567890',
      subscriptionPlan: 'PRO',
      isActive: true,
    },
  });
  console.log(`✅ Tenant siap: ${tenant.businessName} (${tenant.id})`);

  // 2. Seed Super Admin & Venue Manager
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stackplus.studio' },
    update: { password: hashedPassword, tenantId: tenant.id },
    create: {
      email: 'admin@stackplus.studio',
      name: 'Super Admin Futsal',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Admin siap: ${admin.email}`);

  // 3. Seed Venue "Champion Arena"
  const venue = await prisma.venue.upsert({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: 'champion-arena',
      },
    },
    update: {
      phone: '081234567890',
      address: 'Jl. Prof. Soedarto No. 12, Tembalang',
      city: 'Semarang',
      openHour: 7,
      closeHour: 24,
      defaultDpPercent: 50,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      name: 'Champion Arena Futsal & Mini Soccer',
      slug: 'champion-arena',
      phone: '081234567890',
      address: 'Jl. Prof. Soedarto No. 12, Tembalang',
      city: 'Semarang',
      openHour: 7,
      closeHour: 24,
      defaultDpPercent: 50,
      isActive: true,
    },
  });
  console.log(`✅ Venue siap: ${venue.name} (/book/${venue.slug})`);

  // 4. Seed Lapangan & Dynamic Pricing Rules
  const courtsData = [
    {
      name: 'Lapangan 1 - Vinyl Pro',
      type: CourtType.FUTSAL_VINYL,
      lengthMeters: 26,
      widthMeters: 16,
      description: 'Lantai vinyl standar internasional interlock dengan bantalan empuk.',
      pricing: [
        { dayType: DayType.WEEKDAY, startHour: 7, endHour: 15, hourlyRate: BigInt(120000) },
        { dayType: DayType.WEEKDAY, startHour: 15, endHour: 18, hourlyRate: BigInt(150000) },
        { dayType: DayType.WEEKDAY, startHour: 18, endHour: 24, hourlyRate: BigInt(200000) },
        { dayType: DayType.WEEKEND, startHour: 7, endHour: 24, hourlyRate: BigInt(220000) },
      ],
    },
    {
      name: 'Lapangan 2 - Rumput Sintetis',
      type: CourtType.FUTSAL_SYNTHETIC,
      lengthMeters: 28,
      widthMeters: 18,
      description: 'Rumput sintetis monofilamen tebal dengan pasir silika & rubber granule.',
      pricing: [
        { dayType: DayType.WEEKDAY, startHour: 7, endHour: 15, hourlyRate: BigInt(140000) },
        { dayType: DayType.WEEKDAY, startHour: 15, endHour: 18, hourlyRate: BigInt(175000) },
        { dayType: DayType.WEEKDAY, startHour: 18, endHour: 24, hourlyRate: BigInt(225000) },
        { dayType: DayType.WEEKEND, startHour: 7, endHour: 24, hourlyRate: BigInt(250000) },
      ],
    },
    {
      name: 'Lapangan 3 - Mini Soccer Stadium (Outdoor)',
      type: CourtType.MINI_SOCCER_OUTDOOR,
      lengthMeters: 50,
      widthMeters: 30,
      description: 'Lapangan 7 vs 7 outdoor dengan pencahayaan lampu LED 1000 watt.',
      pricing: [
        { dayType: DayType.WEEKDAY, startHour: 7, endHour: 15, hourlyRate: BigInt(300000) },
        { dayType: DayType.WEEKDAY, startHour: 15, endHour: 18, hourlyRate: BigInt(400000) },
        { dayType: DayType.WEEKDAY, startHour: 18, endHour: 24, hourlyRate: BigInt(500000) },
        { dayType: DayType.WEEKEND, startHour: 7, endHour: 24, hourlyRate: BigInt(600000) },
      ],
    },
  ];

  for (const cData of courtsData) {
    let court = await prisma.court.findFirst({
      where: { venueId: venue.id, name: cData.name },
    });

    if (!court) {
      court = await prisma.court.create({
        data: {
          venueId: venue.id,
          name: cData.name,
          type: cData.type,
          lengthMeters: cData.lengthMeters,
          widthMeters: cData.widthMeters,
          description: cData.description,
          isActive: true,
        },
      });
      console.log(`  ➕ Lapangan dibuat: ${court.name}`);
    }

    // Hapus pricing rules lama lalu masukkan yang baru
    await prisma.courtPricingRule.deleteMany({
      where: { courtId: court.id },
    });

    for (const rule of cData.pricing) {
      await prisma.courtPricingRule.create({
        data: {
          courtId: court.id,
          dayType: rule.dayType,
          startHour: rule.startHour,
          endHour: rule.endHour,
          hourlyRate: rule.hourlyRate,
        },
      });
    }
  }

  // 5. Seed Canteen Products
  const canteenItems = [
    { sku: 'BEV-POC-500', name: 'Pocari Sweat 500ml', category: CanteenCategory.BEVERAGE, price: BigInt(10000), costPrice: BigInt(6500), stock: 48 },
    { sku: 'BEV-LEM-600', name: 'Le Minerale 600ml', category: CanteenCategory.BEVERAGE, price: BigInt(5000), costPrice: BigInt(2500), stock: 96 },
    { sku: 'BEV-HYD-330', name: 'Hydro Coco 330ml', category: CanteenCategory.BEVERAGE, price: BigInt(9000), costPrice: BigInt(6000), stock: 36 },
    { sku: 'EQP-VES-SET', name: 'Sewa Rompi Tim (1 Set 10 Pcs)', category: CanteenCategory.EQUIPMENT_RENTAL, price: BigInt(25000), costPrice: BigInt(0), stock: 5 },
    { sku: 'EQP-BAL-PRO', name: 'Sewa Bola Match FIFA Quality', category: CanteenCategory.EQUIPMENT_RENTAL, price: BigInt(15000), costPrice: BigInt(0), stock: 8 },
  ];

  for (const item of canteenItems) {
    const existing = await prisma.canteenProduct.findFirst({
      where: { venueId: venue.id, sku: item.sku },
    });
    if (!existing) {
      await prisma.canteenProduct.create({
        data: {
          venueId: venue.id,
          ...item,
        },
      });
    }
  }
  console.log(`✅ ${canteenItems.length} Produk Kantin & Sewa Alat terdaftar.`);

  console.log('\n🎉 Seeding selesai dengan sukses! Database siap digunakan untuk booking live.');
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
