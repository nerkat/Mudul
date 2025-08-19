// Simple auth service using SQLite directly
const sqlite3 = require('sqlite3').verbose();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const path = require('path');

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(__dirname, '../../packages/storage/dev.db');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_ACCESS_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '30d';

class SimpleAuthService {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
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
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
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
    const token = jwt.sign(
      { 
        sub: userId,
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

    // Store in database
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await this.run(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [`refresh-${Date.now()}`, userId, token, expiresAt.toISOString()]
    );

    return token;
  }

  async login(email, password, rememberMe = false) {
    // Find user by email
    const users = await this.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!users || users.length === 0) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const user = users[0];

    // Verify password
    const isValid = await argon2.verify(user.password_hash, password);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Get user memberships
    const memberships = await this.query(
      `SELECT m.*, o.name as org_name 
       FROM memberships m 
       JOIN orgs o ON m.org_id = o.id 
       WHERE m.user_id = ?`,
      [user.id]
    );

    if (!memberships || memberships.length === 0) {
      throw new Error('NO_ORG_ACCESS');
    }

    // Use first org as active org
    const activeMembership = memberships[0];

    // Generate tokens
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
      orgs: memberships.map(m => ({
        id: m.org_id,
        name: m.org_name,
        role: m.role.toLowerCase(),
      })),
      activeOrgId: activeMembership.org_id,
    };
  }

  async refreshToken(refreshToken) {
    // Verify refresh token
    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET, {
        issuer: 'mudul-api',
        audience: 'mudul-app',
      });
    } catch (err) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Check if token exists in database
    const storedTokens = await this.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > datetime("now")',
      [refreshToken]
    );

    if (!storedTokens || storedTokens.length === 0) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const storedToken = storedTokens[0];

    // Get user's active org
    const memberships = await this.query(
      'SELECT org_id FROM memberships WHERE user_id = ? LIMIT 1',
      [storedToken.user_id]
    );

    if (!memberships || memberships.length === 0) {
      throw new Error('NO_ORG_ACCESS');
    }

    const activeOrgId = memberships[0].org_id;

    // Generate new access token
    const accessToken = this.generateAccessToken(storedToken.user_id, activeOrgId);

    // Rotate refresh token (delete old, create new)
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

  async disconnect() {
    return new Promise((resolve) => {
      this.db.close(resolve);
    });
  }
}

module.exports = { SimpleAuthService };