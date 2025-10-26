import { PrismaClient, UserRole } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

const users = [
  {
    name: 'مدير النظام',
    address: '000 شارع النظام',
    phoneNumber: '5550000',
    meterId: 'SYS001',
    role: UserRole.super_admin,
    password: 'superadminpassword',
  },
  {
    name: 'مسؤول',
    address: '100 الشارع الرئيسي',
    phoneNumber: '5550100',
    meterId: 'ADM001',
    role: UserRole.admin,
    password: 'adminpassword',
  },
  {
    name: 'أليس جونسون',
    address: '123 شارع البلوط',
    phoneNumber: '5550101',
    meterId: 'WTR001',
    role: UserRole.user,
    password: 'password123',
  },
  {
    name: 'بوب ويليامز',
    address: '456 ممر الصنوبر',
    phoneNumber: '5550102',
    meterId: 'WTR002',
    role: UserRole.user,
    password: 'password123',
  },
  {
    name: 'تشارلي براون',
    address: '789 طريق القيقب',
    phoneNumber: '5550103',
    meterId: 'WTR003',
    role: UserRole.user,
    password: 'password123',
  },
];

async function main() {
  await prisma.setting.upsert({
    where: { key: 'water_price_per_unit' },
    create: { key: 'water_price_per_unit', value: '1.5' },
    update: { value: '1.5' },
  });

  for (const user of users) {
    await prisma.user.upsert({
      where: { phoneNumber: user.phoneNumber },
      update: {
        name: user.name,
        address: user.address,
        meterId: user.meterId,
        role: user.role,
        password: user.password,
      },
      create: user,
    });
  }

  console.log('Seed data inserted successfully.');
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
