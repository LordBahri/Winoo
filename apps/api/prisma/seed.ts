import { PrismaClient, Role, PetSpecies, PlanName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Subscription Plans
  const plans = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { name: PlanName.FREE },
      update: {},
      create: {
        name: PlanName.FREE,
        priceMonthly: 0,
        priceYearly: 0,
        maxPets: 1,
        maxTags: 1,
        features: {
          scanNotifications: true,
          scanHistory: 7,
          healthRecords: 10,
          lostPetAlertRadius: 10,
          vetSharing: false,
        },
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { name: PlanName.BASIC },
      update: {},
      create: {
        name: PlanName.BASIC,
        priceMonthly: 9,
        priceYearly: 90,
        maxPets: 3,
        maxTags: 3,
        features: {
          scanNotifications: true,
          scanHistory: 30,
          healthRecords: -1,
          lostPetAlertRadius: 25,
          vetSharing: true,
          maxVets: 1,
        },
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { name: PlanName.PREMIUM },
      update: {},
      create: {
        name: PlanName.PREMIUM,
        priceMonthly: 19,
        priceYearly: 190,
        maxPets: -1,
        maxTags: -1,
        features: {
          scanNotifications: true,
          scanHistory: -1,
          healthRecords: -1,
          lostPetAlertRadius: 100,
          vetSharing: true,
          maxVets: -1,
          priorityLostPet: true,
          whiteLabel: true,
        },
      },
    }),
  ]);

  // Admin user
  const adminHash = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@petid.app' },
    update: {},
    create: {
      email: 'admin@petid.app',
      passwordHash: adminHash,
      name: 'PetID Admin',
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
    },
  });

  // Demo pet owner
  const ownerHash = await bcrypt.hash('Owner@12345', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'demo@petid.app' },
    update: {},
    create: {
      email: 'demo@petid.app',
      passwordHash: ownerHash,
      name: 'Demo Owner',
      role: Role.PET_OWNER,
      phone: '+1 555 000 0001',
      isEmailVerified: true,
    },
  });

  // Demo subscription
  await prisma.userSubscription.upsert({
    where: { userId: owner.id },
    update: {},
    create: {
      userId: owner.id,
      planId: plans[1].id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Demo pet
  const pet = await prisma.pet.upsert({
    where: { microchipNumber: 'DEMO-001' },
    update: {},
    create: {
      ownerId: owner.id,
      name: 'Buddy',
      species: PetSpecies.DOG,
      breed: 'Golden Retriever',
      color: 'Golden',
      weightKg: 28,
      gender: 'MALE',
      microchipNumber: 'DEMO-001',
      dateOfBirth: new Date('2021-03-15'),
      emergencyContact: { name: 'Demo Owner', phone: '+1 555 000 0001' },
    },
  });

  // Demo NFC tag
  await prisma.nfcTag.upsert({
    where: { tagUid: '04:A3:2B:F1:C8:44:80' },
    update: {},
    create: {
      tagUid: '04:A3:2B:F1:C8:44:80',
      petId: pet.id,
      status: 'ACTIVE',
      activatedAt: new Date(),
    },
  });

  console.log('Seed complete!');
  console.log('Admin: admin@petid.app / Admin@12345');
  console.log('Demo:  demo@petid.app  / Owner@12345');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
