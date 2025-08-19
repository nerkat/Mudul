#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const argon2 = require('argon2');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new sqlite3.Database(dbPath);

async function seed() {
  console.log('🌱 Seeding database...');

  // Create password hash
  const passwordHash = await argon2.hash('password');

  // Clear existing data
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('DELETE FROM refresh_tokens');
      db.run('DELETE FROM action_items');
      db.run('DELETE FROM calls');
      db.run('DELETE FROM clients');
      db.run('DELETE FROM memberships');
      db.run('DELETE FROM orgs');
      db.run('DELETE FROM users', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  // Insert demo data
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert organizations
      db.run(
        'INSERT INTO orgs (id, name, plan_tier) VALUES (?, ?, ?)',
        ['acme-sales-org', 'Acme Sales Org', 'pro']
      );

      db.run(
        'INSERT INTO orgs (id, name, plan_tier) VALUES (?, ?, ?)',
        ['viewer-org', 'Viewer Test Org', 'basic']
      );

      // Insert users
      db.run(
        'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)',
        ['user-1', 'demo@mudul.com', 'Demo User', passwordHash]
      );

      db.run(
        'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)',
        ['user-2', 'viewer@mudul.com', 'Viewer User', passwordHash]
      );

      // Insert memberships
      db.run(
        'INSERT INTO memberships (id, user_id, org_id, role) VALUES (?, ?, ?, ?)',
        ['mem-1', 'user-1', 'acme-sales-org', 'OWNER']
      );

      db.run(
        'INSERT INTO memberships (id, user_id, org_id, role) VALUES (?, ?, ?, ?)',
        ['mem-2', 'user-2', 'viewer-org', 'VIEWER']
      );

      // Insert clients
      db.run(
        'INSERT INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
        ['client-acme', 'acme-sales-org', 'Acme Corp', 'acme-corp']
      );

      db.run(
        'INSERT INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
        ['client-beta', 'acme-sales-org', 'Beta Systems', 'beta-systems']
      );

      db.run(
        'INSERT INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
        ['client-gamma', 'acme-sales-org', 'Gamma Industries', 'gamma-industries']
      );

      // Viewer org client (for cross-org testing)
      db.run(
        'INSERT INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
        ['client-viewer-test', 'viewer-org', 'Viewer Test Client', 'viewer-test-client']
      );

      // Insert calls
      db.run(
        'INSERT INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-acme-1', 'acme-sales-org', 'client-acme', 'Discovery Call - Jan 15', 
         'Great discovery call with Acme Corp. They are interested in our enterprise solution.',
         '2024-01-15T10:00:00Z', 1800, 'POSITIVE', 0.8, 0.75]
      );

      db.run(
        'INSERT INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-acme-2', 'acme-sales-org', 'client-acme', 'Follow-up Call - Jan 20',
         'Follow-up call went well. Acme Corp is ready to move forward with pilot program.',
         '2024-01-20T14:00:00Z', 1200, 'POSITIVE', 0.9, 0.9]
      );

      db.run(
        'INSERT INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-beta-1', 'acme-sales-org', 'client-beta', 'Initial Contact - Jan 12',
         'Initial contact with Beta Systems. They have budget constraints but are interested.',
         '2024-01-12T09:00:00Z', 2100, 'NEUTRAL', 0.6, 0.4]
      );

      db.run(
        'INSERT INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-beta-2', 'acme-sales-org', 'client-beta', 'Demo Call - Jan 18',
         'Demo went very well! Beta Systems loved the user interface and core features.',
         '2024-01-18T16:00:00Z', 2700, 'POSITIVE', 0.85, 0.7]
      );

      db.run(
        'INSERT INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-gamma-1', 'acme-sales-org', 'client-gamma', 'Qualification Call - Jan 22',
         'Qualification call with Gamma Industries. Large enterprise with complex needs.',
         '2024-01-22T11:00:00Z', 3600, 'NEUTRAL', 0.7, 0.6]
      );

      // Viewer org call (for cross-org testing)
      db.run(
        'INSERT INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['call-viewer-1', 'viewer-org', 'client-viewer-test', 'Viewer Org Call',
         'Test call for viewer organization.',
         '2024-01-10T12:00:00Z', 1500, 'POSITIVE', 0.75, 0.8]
      );

      // Insert action items
      db.run(
        'INSERT INTO action_items (id, org_id, client_id, owner_id, text, due, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['action-1', 'acme-sales-org', 'client-acme', 'user-1', 'Send follow-up proposal to Acme Corp', '2024-01-25T00:00:00Z', 'OPEN']
      );

      db.run(
        'INSERT INTO action_items (id, org_id, client_id, owner_id, text, due, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['action-2', 'acme-sales-org', 'client-beta', 'user-1', 'Schedule demo for Beta Systems', '2024-01-20T00:00:00Z', 'DONE']
      );

      db.run(
        'INSERT INTO action_items (id, org_id, client_id, owner_id, text, due, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['action-3', 'acme-sales-org', 'client-gamma', 'user-1', 'Research Gamma Industries requirements', '2024-01-30T00:00:00Z', 'OPEN']
      );

      db.run(
        'INSERT INTO action_items (id, org_id, client_id, text, status) VALUES (?, ?, ?, ?, ?)',
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