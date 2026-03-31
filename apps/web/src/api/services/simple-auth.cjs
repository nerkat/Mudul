// Simple auth service using SQLite directly
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { OAuth2Client } = require('google-auth-library');

function findDatabasePath() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace('file:', '');
  }

  const possiblePaths = [
    path.join(__dirname, '../../../../../packages/storage/dev.db'),
    path.join(process.cwd(), '../../packages/storage/dev.db'),
    path.join(process.cwd(), 'packages/storage/dev.db'),
    path.join(process.cwd(), 'dev.db'),
  ];

  for (const candidate of possiblePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return possiblePaths[0];
}

const dbPath = findDatabasePath();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_ACCESS_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '30d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

let googleClient;

function getGoogleClient() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_AUTH_NOT_CONFIGURED');
  }

  if (!googleClient) {
    googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  }

  return googleClient;
}

// Reference org whose demo data is used as the base for all new workspaces
const DEMO_SEED_ORG_ID = 'acme-sales-org';

class SimpleAuthService {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.googleSchemaReady = false;
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }

  createId(prefix) {
    return `${prefix}-${randomUUID()}`;
  }

  async ensureGoogleSchema() {
    if (this.googleSchemaReady) {
      return;
    }

    await this.run(
      `CREATE TABLE IF NOT EXISTS oauth_identities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(provider, provider_user_id)
      )`
    );
    await this.run('CREATE INDEX IF NOT EXISTS idx_oauth_identities_user_provider ON oauth_identities(user_id, provider)');
    this.googleSchemaReady = true;
  }

  buildWorkspaceName(name, email) {
    const base = (name || email.split('@')[0] || 'New user').trim();
    return `${base}'s Workspace`;
  }

  async verifyGoogleCredential(credential) {
    if (process.env.NODE_ENV === 'test' && credential.startsWith('test-google-token:')) {
      const [, rawEmail = '', rawName = 'Test User'] = credential.split(':');
      const email = decodeURIComponent(rawEmail).toLowerCase();
      const name = decodeURIComponent(rawName || 'Test User');

      if (!email.includes('@')) {
        throw new Error('GOOGLE_TOKEN_INVALID');
      }

      return {
        sub: `test-${email}`,
        email,
        name,
      };
    }

    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new Error('GOOGLE_TOKEN_INVALID');
    }

    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      throw new Error('GOOGLE_TOKEN_INVALID');
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
    };
  }

  async getUserById(userId) {
    const users = await this.query('SELECT * FROM users WHERE id = ?', [userId]);
    return users[0] || null;
  }

  async getUserByEmail(email) {
    const users = await this.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    return users[0] || null;
  }

  async getMembershipsForUser(userId) {
    return await this.query(
      `SELECT m.*, o.name as org_name
       FROM memberships m
       JOIN orgs o ON m.org_id = o.id
       WHERE m.user_id = ?
       ORDER BY m.created_at ASC`,
      [userId]
    );
  }

  async seedDemoDataForOrg(orgId, ownerId) {
    let demoData;
    try {
      demoData = await import('../../../../../packages/core/src/demo-data.js');
    } catch (err) {
      console.warn('[seedDemoDataForOrg] Could not load demo data:', err.message);
      return;
    }

    const { demoClients, demoCalls, demoActionItems } = demoData;

    // Map old client IDs to new org-scoped IDs
    const clientIdMap = {};
    for (const client of demoClients.filter((c) => c.orgId === DEMO_SEED_ORG_ID)) {
      const newClientId = this.createId('client');
      clientIdMap[client.id] = newClientId;
      try {
        await this.run(
          'INSERT INTO clients (id, org_id, name, slug, created_at) VALUES (?, ?, ?, ?, ?)',
          [newClientId, orgId, client.name, client.slug, client.createdAt]
        );
      } catch (_e) {
        console.warn('[seedDemoDataForOrg] Skipping duplicate client:', client.name, _e.message);
      }
    }

    // Map old call IDs to new IDs and insert
    const callIdMap = {};
    for (const call of demoCalls.filter((c) => c.orgId === DEMO_SEED_ORG_ID)) {
      if (!clientIdMap[call.clientId]) continue;
      const newCallId = this.createId('call');
      callIdMap[call.id] = newCallId;
      try {
        await this.run(
          'INSERT INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newCallId,
            orgId,
            clientIdMap[call.clientId],
            call.name,
            call.summary,
            call.ts,
            call.durationSec,
            call.sentiment.toUpperCase(),
            call.score,
            call.bookingLikelihood,
            call.ts,
          ]
        );
      } catch (_e) {
        console.warn('[seedDemoDataForOrg] Skipping duplicate call:', call.name, _e.message);
      }
    }

    // Insert action items
    for (const ai of demoActionItems.filter((a) => a.orgId === DEMO_SEED_ORG_ID)) {
      if (!clientIdMap[ai.clientId]) continue;
      try {
        await this.run(
          'INSERT INTO action_items (id, org_id, client_id, owner_id, text, due, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            this.createId('action'),
            orgId,
            clientIdMap[ai.clientId],
            ownerId,
            ai.text,
            ai.due || null,
            ai.status.toUpperCase(),
            new Date().toISOString(),
          ]
        );
      } catch (_e) {
        console.warn('[seedDemoDataForOrg] Skipping action item:', ai.text.slice(0, 50), _e.message);
      }
    }
  }

  async orgHasSeedVisibleData(orgId) {
    const [clientCountRow] = await this.query(
      'SELECT COUNT(*) as count FROM clients WHERE org_id = ? AND archived_at IS NULL',
      [orgId]
    );
    const [callCountRow] = await this.query(
      `SELECT COUNT(*) as count
       FROM calls
       INNER JOIN clients ON clients.id = calls.client_id
       WHERE calls.org_id = ? AND calls.archived_at IS NULL AND clients.archived_at IS NULL`,
      [orgId]
    );

    return Number(clientCountRow?.count || 0) > 0 || Number(callCountRow?.count || 0) > 0;
  }

  async ensureOrgHasSeedData(orgId, ownerId) {
    if (!orgId) {
      return;
    }

    if (await this.orgHasSeedVisibleData(orgId)) {
      return;
    }

    await this.seedDemoDataForOrg(orgId, ownerId);
  }

  async ensureMembershipForUser(userId, profile) {
    const memberships = await this.getMembershipsForUser(userId);
    if (memberships.length > 0) {
      await this.ensureOrgHasSeedData(memberships[0].org_id, userId);
      return await this.getMembershipsForUser(userId);
    }

    const orgId = this.createId('org');
    const membershipId = this.createId('membership');
    const now = new Date().toISOString();

    await this.run('BEGIN TRANSACTION');

    try {
      await this.run(
        'INSERT INTO orgs (id, name, plan_tier, created_at) VALUES (?, ?, ?, ?)',
        [orgId, this.buildWorkspaceName(profile.name, profile.email), 'pro', now]
      );
      await this.run(
        'INSERT INTO memberships (id, user_id, org_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
        [membershipId, userId, orgId, 'OWNER', now]
      );
      await this.run('COMMIT');
    } catch (error) {
      await this.run('ROLLBACK').catch(() => {});
      throw error;
    }

    // Seed demo data into the new org so new users see example content
    await this.seedDemoDataForOrg(orgId, userId);

    return await this.getMembershipsForUser(userId);
  }

  async loginAsDemoUser() {
    const users = await this.query('SELECT * FROM users WHERE email = ?', ['demo@mudul.com']);
    if (!users || users.length === 0) {
      throw new Error('DEMO_USER_NOT_FOUND');
    }
    return await this.buildAuthResponseForUser(users[0].id, true);
  }

  generateAccessToken(userId, orgId) {
    return jwt.sign(
      {
        sub: userId,
        orgId,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: JWT_ACCESS_EXPIRES,
        issuer: 'mudul-api',
        audience: 'mudul-app',
      }
    );
  }

  async generateRefreshToken(userId) {
    const tokenId = this.createId('rt');
    const token = jwt.sign(
      {
        sub: userId,
        jti: tokenId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRES,
        issuer: 'mudul-api',
        audience: 'mudul-app',
      }
    );

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.run(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [tokenId, userId, token, expiresAt.toISOString()]
    );

    return token;
  }

  async buildAuthResponseForUser(userId, rememberMe) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const memberships = await this.getMembershipsForUser(userId);
    if (!memberships || memberships.length === 0) {
      throw new Error('NO_ORG_ACCESS');
    }

    const activeMembership = memberships[0];
    await this.ensureOrgHasSeedData(activeMembership.org_id, user.id);
    const accessToken = this.generateAccessToken(user.id, activeMembership.org_id);
    const refreshToken = rememberMe ? await this.generateRefreshToken(user.id) : undefined;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      orgs: memberships.map((membership) => ({
        id: membership.org_id,
        name: membership.org_name,
        role: membership.role.toLowerCase(),
      })),
      activeOrgId: activeMembership.org_id,
    };
  }

  async provisionGoogleUser(profile) {
    await this.ensureGoogleSchema();

    const existingIdentity = await this.query(
      `SELECT user_id
       FROM oauth_identities
       WHERE provider = ? AND provider_user_id = ?`,
      ['google', profile.sub]
    );

    if (existingIdentity.length > 0) {
      return existingIdentity[0].user_id;
    }

    const user = await this.getUserByEmail(profile.email);
    const now = new Date().toISOString();

    await this.run('BEGIN TRANSACTION');

    try {
      if (!user) {
        const userId = this.createId('user');
        const orgId = this.createId('org');
        const membershipId = this.createId('membership');

        await this.run(
          'INSERT INTO users (id, email, name, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, profile.email, profile.name, `GOOGLE_AUTH_ONLY:${profile.sub}`, now, now]
        );
        await this.run(
          'INSERT INTO orgs (id, name, plan_tier, created_at) VALUES (?, ?, ?, ?)',
          [orgId, this.buildWorkspaceName(profile.name, profile.email), 'pro', now]
        );
        await this.run(
          'INSERT INTO memberships (id, user_id, org_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
          [membershipId, userId, orgId, 'OWNER', now]
        );
        await this.run(
          'INSERT INTO oauth_identities (id, user_id, provider, provider_user_id, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [this.createId('oauth'), userId, 'google', profile.sub, profile.email, now, now]
        );
        await this.run('COMMIT');
        // Seed demo data into the new org so new users see example content
        await this.seedDemoDataForOrg(orgId, userId);
        return userId;
      }

      await this.run(
        'INSERT INTO oauth_identities (id, user_id, provider, provider_user_id, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [this.createId('oauth'), user.id, 'google', profile.sub, profile.email, now, now]
      );
      await this.run(
        'UPDATE users SET name = ?, last_login_at = ? WHERE id = ?',
        [profile.name, now, user.id]
      );
      await this.run('COMMIT');
    } catch (error) {
      await this.run('ROLLBACK').catch(() => {});
      throw error;
    }

    await this.ensureMembershipForUser(user.id, profile);
    return user.id;
  }

  async loginWithGoogle(credential, rememberMe = true) {
    const profile = await this.verifyGoogleCredential(credential);
    const userId = await this.provisionGoogleUser(profile);
    const now = new Date().toISOString();

    await this.run('UPDATE users SET name = ?, last_login_at = ? WHERE id = ?', [profile.name, now, userId]);
    await this.ensureMembershipForUser(userId, profile);

    return await this.buildAuthResponseForUser(userId, rememberMe);
  }

  async refreshToken(refreshToken) {
    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET, {
        issuer: 'mudul-api',
        audience: 'mudul-app',
      });
    } catch (_err) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const storedTokens = await this.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > datetime("now")',
      [refreshToken]
    );

    if (!storedTokens || storedTokens.length === 0) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const storedToken = storedTokens[0];
    const memberships = await this.query('SELECT org_id FROM memberships WHERE user_id = ? LIMIT 1', [storedToken.user_id]);

    if (!memberships || memberships.length === 0) {
      throw new Error('NO_ORG_ACCESS');
    }

    const accessToken = this.generateAccessToken(storedToken.user_id, memberships[0].org_id);

    await this.run('DELETE FROM refresh_tokens WHERE id = ?', [storedToken.id]);
    const newRefreshToken = await this.generateRefreshToken(storedToken.user_id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'mudul-api',
        audience: 'mudul-app',
      });
    } catch {
      return null;
    }
  }

  getUserFromToken(token) {
    const payload = this.verifyToken(token);
    if (!payload) return null;

    return {
      userId: payload.sub,
      orgId: payload.orgId,
    };
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await this.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
  }

  async disconnect() {
    return new Promise((resolve) => {
      this.db.close(resolve);
    });
  }
}

module.exports = { SimpleAuthService };