import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRoutes } from '../routes/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

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
});