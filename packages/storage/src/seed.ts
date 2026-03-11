import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import {
  demoActionItems,
  demoCalls,
  demoClients,
  demoMemberships,
  demoOrganizations,
  demoUsers,
} from '../../core/src/demo-data.js';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.refreshToken.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.call.deleteMany();
  await prisma.client.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.org.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await argon2.hash('password');

  for (const org of demoOrganizations) {
    await prisma.org.create({
      data: {
        id: org.id,
        name: org.name,
        planTier: org.planTier,
        createdAt: new Date(org.createdAt),
      },
    });
  }

  for (const user of demoUsers) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash,
        createdAt: new Date(user.createdAt),
        lastLoginAt: new Date(user.lastLoginAt),
      },
    });
  }

  for (const membership of demoMemberships) {
    await prisma.membership.create({
      data: {
        id: membership.id,
        userId: membership.userId,
        orgId: membership.orgId,
        role: membership.role.toUpperCase() as 'OWNER' | 'VIEWER',
        createdAt: new Date(membership.createdAt),
      },
    });
  }

  for (const client of demoClients) {
    await prisma.client.create({
      data: {
        id: client.id,
        orgId: client.orgId,
        name: client.name,
        slug: client.slug,
        createdAt: new Date(client.createdAt),
      },
    });
  }

  for (const call of demoCalls) {
    await prisma.call.create({
      data: {
        id: call.id,
        orgId: call.orgId,
        clientId: call.clientId,
        name: call.name,
        summary: call.summary,
        ts: new Date(call.ts),
        durationSec: call.durationSec,
        sentiment: call.sentiment.toUpperCase() as 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
        score: call.score,
        bookingLikelihood: call.bookingLikelihood,
        createdAt: new Date(call.ts),
      },
    });
  }

  for (const actionItem of demoActionItems) {
    await prisma.actionItem.create({
      data: {
        id: actionItem.id,
        orgId: actionItem.orgId,
        clientId: actionItem.clientId,
        ownerId: actionItem.ownerId,
        text: actionItem.text,
        due: actionItem.due ? new Date(actionItem.due) : null,
        status: actionItem.status.toUpperCase() as 'OPEN' | 'DONE',
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Created ${await prisma.user.count()} users`);
  console.log(`🏢 Created ${await prisma.org.count()} organizations`);
  console.log(`👥 Created ${await prisma.client.count()} clients`);
  console.log(`📞 Created ${await prisma.call.count()} calls`);
  console.log(`✅ Created ${await prisma.actionItem.count()} action items`);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });