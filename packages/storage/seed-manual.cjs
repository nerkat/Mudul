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

      // Create indexes for performance
      db.run('CREATE INDEX IF NOT EXISTS idx_memberships_user_org ON memberships(user_id, org_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_calls_client_ts ON calls(client_id, ts)');
      db.run('CREATE INDEX IF NOT EXISTS idx_calls_org_client_ts ON calls(org_id, client_id, ts)');
      db.run('CREATE INDEX IF NOT EXISTS idx_action_items_org ON action_items(org_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_action_items_org_status_due ON action_items(org_id, status, due)');
      db.run('CREATE INDEX IF NOT EXISTS idx_action_items_client_status_due ON action_items(client_id, status, due)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  // Idempotent seeding - use INSERT OR REPLACE instead of DELETE + INSERT
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert organizations
      db.run(
        'INSERT OR REPLACE INTO orgs (id, name, plan_tier) VALUES (?, ?, ?)',
        ['acme-sales-org', 'Acme Sales Org', 'pro']
      );

      db.run(
        'INSERT OR REPLACE INTO orgs (id, name, plan_tier) VALUES (?, ?, ?)',
        ['viewer-org', 'Viewer Test Org', 'basic']
      );

      // Insert users
      db.run(
        'INSERT OR REPLACE INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)',
        ['user-1', 'demo@mudul.com', 'Demo User', passwordHash]
      );

      db.run(
        'INSERT OR REPLACE INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)',
        ['user-2', 'viewer@mudul.com', 'Viewer User', passwordHash]
      );

      // Insert memberships
      db.run(
        'INSERT OR REPLACE INTO memberships (id, user_id, org_id, role) VALUES (?, ?, ?, ?)',
        ['mem-1', 'user-1', 'acme-sales-org', 'OWNER']
      );

      db.run(
        'INSERT OR REPLACE INTO memberships (id, user_id, org_id, role) VALUES (?, ?, ?, ?)',
        ['mem-2', 'user-2', 'viewer-org', 'VIEWER']
      );

      // Insert clients
      db.run(
        'INSERT OR REPLACE INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
        ['client-acme', 'acme-sales-org', 'Acme Corp', 'acme-corp']
      );

      db.run(
        'INSERT OR REPLACE INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
        ['client-beta', 'acme-sales-org', 'Beta Systems', 'beta-systems']
      );

      db.run(
        'INSERT OR REPLACE INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
        ['client-gamma', 'acme-sales-org', 'Gamma Industries', 'gamma-industries']
      );

      // Viewer org client (for cross-org testing)
      db.run(
        'INSERT OR REPLACE INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
        ['client-viewer-test', 'viewer-org', 'Viewer Test Client', 'viewer-test-client']
      );

      // Insert calls
      db.run(
        'INSERT OR REPLACE INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-acme-1', 'acme-sales-org', 'client-acme', 'Discovery Call - Jan 15', 
         'Great discovery call with Acme Corp. They are interested in our enterprise solution.',
         '2024-01-15T10:00:00Z', 1800, 'POSITIVE', 0.8, 0.75]
      );

      db.run(
        'INSERT OR REPLACE INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-acme-2', 'acme-sales-org', 'client-acme', 'Follow-up Call - Jan 20',
         'Follow-up call went well. Acme Corp is ready to move forward with pilot program.',
         '2024-01-20T14:00:00Z', 1200, 'POSITIVE', 0.9, 0.9]
      );

      db.run(
        'INSERT OR REPLACE INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-beta-1', 'acme-sales-org', 'client-beta', 'Initial Contact - Jan 12',
         'Initial contact with Beta Systems. They have budget constraints but are interested.',
         '2024-01-12T09:00:00Z', 2100, 'NEUTRAL', 0.6, 0.4]
      );

      db.run(
        'INSERT OR REPLACE INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-beta-2', 'acme-sales-org', 'client-beta', 'Demo Call - Jan 18',
         'Demo went very well! Beta Systems loved the user interface and core features.',
         '2024-01-18T16:00:00Z', 2700, 'POSITIVE', 0.85, 0.7]
      );

      db.run(
        'INSERT OR REPLACE INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-gamma-1', 'acme-sales-org', 'client-gamma', 'Qualification Call - Jan 22',
         'Qualification call with Gamma Industries. Large enterprise with complex needs.',
         '2024-01-22T11:00:00Z', 3600, 'NEUTRAL', 0.7, 0.6]
      );

      // Viewer org call (for cross-org testing)
      db.run(
        'INSERT OR REPLACE INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-viewer-1', 'viewer-org', 'client-viewer-test', 'Viewer Org Call',
         'Test call for viewer organization.',
         '2024-01-10T12:00:00Z', 1500, 'POSITIVE', 0.75, 0.8]
      );

      // Insert action items
      db.run(
        'INSERT OR REPLACE INTO action_items (id, org_id, client_id, owner_id, text, due, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['action-1', 'acme-sales-org', 'client-acme', 'user-1', 'Send follow-up proposal to Acme Corp', '2024-01-25T00:00:00Z', 'OPEN']
      );

      db.run(
        'INSERT OR REPLACE INTO action_items (id, org_id, client_id, owner_id, text, due, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['action-2', 'acme-sales-org', 'client-beta', 'user-1', 'Schedule demo for Beta Systems', '2024-01-20T00:00:00Z', 'DONE']
      );

      db.run(
        'INSERT OR REPLACE INTO action_items (id, org_id, client_id, owner_id, text, due, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['action-3', 'acme-sales-org', 'client-gamma', 'user-1', 'Research Gamma Industries requirements', '2024-01-30T00:00:00Z', 'OPEN']
      );

      db.run(
        'INSERT OR REPLACE INTO action_items (id, org_id, client_id, text, status) VALUES (?, ?, ?, ?, ?)',
        ['action-4', 'acme-sales-org', 'client-acme', 'Contact technical team for integration details', 'OPEN'],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  console.log('✅ Database seeded successfully');
  db.close();
}

// Add sqlite3 as dependency and run
seed().catch(console.error);