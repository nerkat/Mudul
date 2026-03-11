#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const argon2 = require('argon2');
const path = require('path');

// Production safety guard
if (process.env.NODE_ENV === 'production') {
  console.error('🚨 ERROR: Seed script cannot run in production environment');
  console.error('   Set NODE_ENV to "development" or "test" to proceed');
  process.exit(1);
}

const dbPath = path.join(__dirname, 'dev.db');
const db = new sqlite3.Database(dbPath);

async function seed() {
  console.log('🌱 Seeding database...');

  const {
    demoActionItems,
    demoCalls,
    demoClients,
    demoMemberships,
    demoOrganizations,
    demoUsers,
  } = await import('../core/src/demo-data.js');

  // Create password hash
  const passwordHash = await argon2.hash('password');

  // Create tables if they don't exist
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create tables based on Prisma schema
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login_at DATETIME
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS orgs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          plan_tier TEXT DEFAULT 'pro',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS memberships (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          org_id TEXT NOT NULL,
          role TEXT DEFAULT 'VIEWER',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
          UNIQUE(user_id, org_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL,
          name TEXT NOT NULL,
          slug TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
          UNIQUE(org_id, name)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS calls (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          name TEXT,
          summary TEXT,
          ts DATETIME DEFAULT CURRENT_TIMESTAMP,
          duration_sec INTEGER,
          sentiment TEXT DEFAULT 'NEUTRAL',
          score REAL,
          booking_likelihood REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS action_items (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL,
          client_id TEXT,
          owner_id TEXT,
          text TEXT NOT NULL,
          due DATETIME,
          status TEXT DEFAULT 'OPEN',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS oauth_identities (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          provider_user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(provider, provider_user_id)
        )
      `);

      // Create indexes for performance
      db.run('CREATE INDEX IF NOT EXISTS idx_memberships_user_org ON memberships(user_id, org_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_calls_client_ts ON calls(client_id, ts)');
      db.run('CREATE INDEX IF NOT EXISTS idx_calls_org_client_ts ON calls(org_id, client_id, ts)');
      db.run('CREATE INDEX IF NOT EXISTS idx_action_items_org ON action_items(org_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_action_items_org_status_due ON action_items(org_id, status, due)');
      db.run('CREATE INDEX IF NOT EXISTS idx_action_items_client_status_due ON action_items(client_id, status, due)');
      db.run('CREATE INDEX IF NOT EXISTS idx_oauth_identities_user_provider ON oauth_identities(user_id, provider)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  // Idempotent seeding - use INSERT OR REPLACE instead of DELETE + INSERT
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      const statements = [];

      for (const org of demoOrganizations) {
        statements.push([
          'INSERT OR REPLACE INTO orgs (id, name, plan_tier, created_at) VALUES (?, ?, ?, ?)',
          [org.id, org.name, org.planTier, org.createdAt],
        ]);
      }

      for (const user of demoUsers) {
        statements.push([
          'INSERT OR REPLACE INTO users (id, email, name, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.email, user.name, passwordHash, user.createdAt, user.lastLoginAt],
        ]);
      }

      for (const membership of demoMemberships) {
        statements.push([
          'INSERT OR REPLACE INTO memberships (id, user_id, org_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
          [membership.id, membership.userId, membership.orgId, membership.role.toUpperCase(), membership.createdAt],
        ]);
      }

      for (const client of demoClients) {
        statements.push([
          'INSERT OR REPLACE INTO clients (id, org_id, name, slug, created_at) VALUES (?, ?, ?, ?, ?)',
          [client.id, client.orgId, client.name, client.slug, client.createdAt],
        ]);
      }

      for (const call of demoCalls) {
        statements.push([
          'INSERT OR REPLACE INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            call.id,
            call.orgId,
            call.clientId,
            call.name,
            call.summary,
            call.ts,
            call.durationSec,
            call.sentiment.toUpperCase(),
            call.score,
            call.bookingLikelihood,
            call.ts,
          ],
        ]);
      }

      for (const actionItem of demoActionItems) {
        statements.push([
          'INSERT OR REPLACE INTO action_items (id, org_id, client_id, owner_id, text, due, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            actionItem.id,
            actionItem.orgId,
            actionItem.clientId,
            actionItem.ownerId,
            actionItem.text,
            actionItem.due,
            actionItem.status.toUpperCase(),
          ],
        ]);
      }

      let index = 0;
      const runNext = () => {
        if (index >= statements.length) {
          resolve();
          return;
        }

        const [sql, params] = statements[index++];
        db.run(sql, params, (err) => {
          if (err) {
            reject(err);
            return;
          }
          runNext();
        });
      };

      runNext();
    });
  });

  console.log('✅ Database seeded successfully');
  db.close();
}

// Add sqlite3 as dependency and run
seed().catch(console.error);