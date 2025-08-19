import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

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

  // Create organization
  const org = await prisma.org.create({
    data: {
      id: 'acme',
      name: 'Acme Sales Org',
      planTier: 'pro',
    },
  });

  // Create users
  const ownerUser = await prisma.user.create({
    data: {
      id: 'user-1',
      email: 'demo@mudul.com',
      name: 'Demo User',
      passwordHash: await argon2.hash('password'),
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      id: 'user-2', 
      email: 'viewer@mudul.com',
      name: 'Viewer User',
      passwordHash: await argon2.hash('password'),
    },
  });

  // Create memberships
  await prisma.membership.create({
    data: {
      userId: ownerUser.id,
      orgId: org.id,
      role: 'OWNER',
    },
  });

  await prisma.membership.create({
    data: {
      userId: viewerUser.id,
      orgId: org.id,
      role: 'VIEWER',
    },
  });

  // Create clients
  const acmeClient = await prisma.client.create({
    data: {
      id: 'client-acme',
      orgId: org.id,
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  });

  const betaClient = await prisma.client.create({
    data: {
      id: 'client-beta',
      orgId: org.id,
      name: 'Beta Systems',
      slug: 'beta-systems',
    },
  });

  const gammaClient = await prisma.client.create({
    data: {
      id: 'client-gamma',
      orgId: org.id,
      name: 'Gamma Industries',
      slug: 'gamma-industries',
    },
  });

  // Create calls
  await prisma.call.create({
    data: {
      id: 'call-acme-1',
      orgId: org.id,
      clientId: acmeClient.id,
      name: 'Discovery Call - Jan 15',
      summary: 'Great discovery call with Acme Corp. They\'re interested in our enterprise solution to solve their scaling challenges.',
      ts: new Date('2024-01-15T10:00:00Z'),
      durationSec: 1800, // 30 minutes
      sentiment: 'POSITIVE',
      score: 0.8,
      bookingLikelihood: 0.75,
    },
  });

  await prisma.call.create({
    data: {
      id: 'call-acme-2',
      orgId: org.id,
      clientId: acmeClient.id,
      name: 'Follow-up Call - Jan 20',
      summary: 'Follow-up call went well. Acme Corp is ready to move forward with pilot program.',
      ts: new Date('2024-01-20T14:00:00Z'),
      durationSec: 1200, // 20 minutes
      sentiment: 'POSITIVE',
      score: 0.9,
      bookingLikelihood: 0.9,
    },
  });

  await prisma.call.create({
    data: {
      id: 'call-beta-1',
      orgId: org.id,
      clientId: betaClient.id,
      name: 'Initial Contact - Jan 12',
      summary: 'Initial contact with Beta Systems. They have budget constraints but are interested in our basic offering.',
      ts: new Date('2024-01-12T09:00:00Z'),
      durationSec: 2100, // 35 minutes
      sentiment: 'NEUTRAL',
      score: 0.6,
      bookingLikelihood: 0.4,
    },
  });

  await prisma.call.create({
    data: {
      id: 'call-beta-2',
      orgId: org.id,
      clientId: betaClient.id,
      name: 'Demo Call - Jan 18',
      summary: 'Demo went very well! Beta Systems loved the user interface and core features.',
      ts: new Date('2024-01-18T16:00:00Z'),
      durationSec: 2700, // 45 minutes
      sentiment: 'POSITIVE',
      score: 0.85,
      bookingLikelihood: 0.7,
    },
  });

  await prisma.call.create({
    data: {
      id: 'call-gamma-1',
      orgId: org.id,
      clientId: gammaClient.id,
      name: 'Qualification Call - Jan 22',
      summary: 'Qualification call with Gamma Industries. Large enterprise with complex needs.',
      ts: new Date('2024-01-22T11:00:00Z'),
      durationSec: 3000, // 50 minutes
      sentiment: 'NEUTRAL',
      score: 0.55,
      bookingLikelihood: 0.5,
    },
  });

  // Create action items
  await prisma.actionItem.create({
    data: {
      orgId: org.id,
      clientId: acmeClient.id,
      ownerId: ownerUser.id,
      text: 'Send enterprise pricing proposal',
      due: new Date('2024-01-18T00:00:00Z'),
      status: 'OPEN',
    },
  });

  await prisma.actionItem.create({
    data: {
      orgId: org.id,
      clientId: betaClient.id,
      ownerId: ownerUser.id,
      text: 'Provide integration documentation',
      due: new Date('2024-01-22T00:00:00Z'),
      status: 'OPEN',
    },
  });

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