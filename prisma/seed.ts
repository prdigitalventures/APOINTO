import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('demo123', 10);

  const owner = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      name: 'Ravi Kumar',
      phone: '9876543210',
      password,
      role: 'OWNER',
      email: 'ravi@example.com',
    },
  });

  const customer = await prisma.user.upsert({
    where: { phone: '9876543211' },
    update: {},
    create: {
      name: 'Ranjith',
      phone: '9876543211',
      password,
      role: 'CUSTOMER',
      email: 'ranjith@example.com',
    },
  });

  const business = await prisma.business.upsert({
    where: { slug: 'ravihairstudio' },
    update: {},
    create: {
      ownerId: owner.id,
      name: 'Ravi Hair Studio',
      slug: 'ravihairstudio',
      category: 'beauty',
      location: 'Koramangala, Bangalore',
      about: 'Premium hair styling and grooming services',
      description: 'Hair salon specializing in cuts, styling, and spa treatments',
      bookingSchema: JSON.stringify({
        category: 'beauty',
        steps: [
          { id: 'service', type: 'service', label: 'Choose Service', required: true },
          { id: 'staff', type: 'staff', label: 'Choose Staff', required: true },
          { id: 'date', type: 'date', label: 'Choose Date', required: true },
          { id: 'time', type: 'time', label: 'Choose Time', required: true },
        ],
        staffRequired: true,
      }),
      advanceBookingDays: 30,
      bufferMinutes: 5,
    },
  });

  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'seed-haircut' },
      update: {},
      create: { id: 'seed-haircut', businessId: business.id, name: 'Haircut', price: 300, duration: 30, sortOrder: 0 },
    }),
    prisma.service.upsert({
      where: { id: 'seed-beard' },
      update: {},
      create: { id: 'seed-beard', businessId: business.id, name: 'Beard Trim', price: 150, duration: 15, sortOrder: 1 },
    }),
    prisma.service.upsert({
      where: { id: 'seed-facial' },
      update: {},
      create: { id: 'seed-facial', businessId: business.id, name: 'Facial', price: 500, duration: 45, sortOrder: 2 },
    }),
    prisma.service.upsert({
      where: { id: 'seed-spa' },
      update: {},
      create: { id: 'seed-spa', businessId: business.id, name: 'Hair Spa', price: 800, duration: 60, sortOrder: 3 },
    }),
  ]);

  const staffMembers = await Promise.all([
    prisma.staff.upsert({
      where: { id: 'seed-ravi' },
      update: {},
      create: { id: 'seed-ravi', businessId: business.id, name: 'Ravi', role: 'Senior Stylist' },
    }),
    prisma.staff.upsert({
      where: { id: 'seed-ajay' },
      update: {},
      create: { id: 'seed-ajay', businessId: business.id, name: 'Ajay', role: 'Stylist' },
    }),
    prisma.staff.upsert({
      where: { id: 'seed-kumar' },
      update: {},
      create: { id: 'seed-kumar', businessId: business.id, name: 'Kumar', role: 'Spa Specialist' },
    }),
  ]);

  for (const day of [1, 2, 3, 4, 5, 6]) {
    await prisma.businessHour.upsert({
      where: { businessId_day: { businessId: business.id, day } },
      update: {},
      create: { businessId: business.id, day, openingTime: '10:00', closingTime: '21:00' },
    });
    for (const s of staffMembers) {
      await prisma.staffHour.upsert({
        where: { staffId_day: { staffId: s.id, day } },
        update: {},
        create: { staffId: s.id, day, openingTime: '10:00', closingTime: '21:00' },
      });
    }
  }
  await prisma.businessHour.upsert({
    where: { businessId_day: { businessId: business.id, day: 0 } },
    update: {},
    create: { businessId: business.id, day: 0, openingTime: '00:00', closingTime: '00:00', isClosed: true },
  });

  await prisma.break.upsert({
    where: { id: 'seed-lunch' },
    update: {},
    create: { id: 'seed-lunch', businessId: business.id, startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
  });

  const staffServiceMap = [
    { staffId: 'seed-ravi', services: ['seed-haircut', 'seed-beard'] },
    { staffId: 'seed-ajay', services: ['seed-haircut', 'seed-beard'] },
    { staffId: 'seed-kumar', services: ['seed-facial', 'seed-spa'] },
  ];

  for (const mapping of staffServiceMap) {
    for (const serviceId of mapping.services) {
      await prisma.staffService.upsert({
        where: { staffId_serviceId: { staffId: mapping.staffId, serviceId } },
        update: {},
        create: { staffId: mapping.staffId, serviceId },
      });
    }
  }

  console.log('✅ Seed complete');
  console.log('Owner:', owner.phone, '/ demo123');
  console.log('Customer:', customer.phone, '/ demo123');
  console.log('Business:', `/${business.slug}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
