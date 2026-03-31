import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRoutes } from '../routes/auth';
import { orgRoutes } from '../routes/org';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);

describe('Google authentication', () => {
  let authService: any;

  beforeAll(async () => {
    const { SimpleAuthService } = require('../services/simple-auth.cjs');
    authService = new SimpleAuthService();
  });

  afterAll(async () => {
    await authService.disconnect();
  });

  it('provisions a new user and workspace from a Google credential', async () => {
    const email = `google-user-${Date.now()}@example.com`;
    const response = await request(app)
      .post('/api/auth/google')
      .send({
        credential: `test-google-token:${encodeURIComponent(email)}:${encodeURIComponent('Google User')}`,
        rememberMe: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);
    expect(response.body.orgs).toHaveLength(1);
    expect(response.body.orgs[0].role).toBe('owner');
    expect(response.body.refreshToken).toBeTruthy();
  });

  it('reuses the same user for subsequent Google logins', async () => {
    const email = `repeat-google-${Date.now()}@example.com`;
    const credential = `test-google-token:${encodeURIComponent(email)}:${encodeURIComponent('Repeat User')}`;

    const firstResponse = await request(app)
      .post('/api/auth/google')
      .send({ credential, rememberMe: true });

    const secondResponse = await request(app)
      .post('/api/auth/google')
      .send({ credential, rememberMe: true });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.user.id).toBe(firstResponse.body.user.id);

    const identities = await authService.query(
      'SELECT * FROM oauth_identities WHERE email = ?',
      [email]
    );

    expect(identities).toHaveLength(1);
  });

  it('seeds demo data for an existing user when their current workspace is empty', async () => {
    const timestamp = Date.now();
    const userId = `user-empty-${timestamp}`;
    const orgId = `org-empty-${timestamp}`;
    const membershipId = `membership-empty-${timestamp}`;
    const email = `empty-workspace-${timestamp}@example.com`;
    const now = new Date().toISOString();

    await authService.run(
      'INSERT INTO users (id, email, name, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, 'Empty Workspace', 'GOOGLE_AUTH_ONLY:seed-test', now, now]
    );
    await authService.run(
      'INSERT INTO orgs (id, name, plan_tier, created_at) VALUES (?, ?, ?, ?)',
      [orgId, 'Empty Workspace Org', 'pro', now]
    );
    await authService.run(
      'INSERT INTO memberships (id, user_id, org_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [membershipId, userId, orgId, 'OWNER', now]
    );

    const response = await request(app)
      .post('/api/auth/google')
      .send({
        credential: `test-google-token:${encodeURIComponent(email)}:${encodeURIComponent('Empty Workspace')}`,
        rememberMe: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.activeOrgId).toBe(orgId);

    const [clientCount] = await authService.query(
      'SELECT COUNT(*) as count FROM clients WHERE org_id = ? AND archived_at IS NULL',
      [orgId]
    );
    const [callCount] = await authService.query(
      'SELECT COUNT(*) as count FROM calls WHERE org_id = ? AND archived_at IS NULL',
      [orgId]
    );

    expect(Number(clientCount.count)).toBeGreaterThan(0);
    expect(Number(callCount.count)).toBeGreaterThan(0);
  });

  it('seeds demo data when an existing session requests the org tree for an empty workspace', async () => {
    const timestamp = Date.now();
    const userId = `user-tree-empty-${timestamp}`;
    const orgId = `org-tree-empty-${timestamp}`;
    const membershipId = `membership-tree-empty-${timestamp}`;
    const now = new Date().toISOString();

    await authService.run(
      'INSERT INTO users (id, email, name, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, `tree-empty-${timestamp}@example.com`, 'Tree Empty Workspace', 'GOOGLE_AUTH_ONLY:seed-tree-test', now, now]
    );
    await authService.run(
      'INSERT INTO orgs (id, name, plan_tier, created_at) VALUES (?, ?, ?, ?)',
      [orgId, 'Tree Empty Workspace Org', 'pro', now]
    );
    await authService.run(
      'INSERT INTO memberships (id, user_id, org_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [membershipId, userId, orgId, 'OWNER', now]
    );

    const accessToken = authService.generateAccessToken(userId, orgId);

    const treeResponse = await request(app)
      .get('/api/org/tree')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(treeResponse.status).toBe(200);
    expect(Array.isArray(treeResponse.body.clients)).toBe(true);
    expect(Array.isArray(treeResponse.body.calls)).toBe(true);
    expect(treeResponse.body.clients.length).toBeGreaterThan(0);
    expect(treeResponse.body.calls.length).toBeGreaterThan(0);
  });
});