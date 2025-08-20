import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRoutes } from '../routes/auth';
import { orgRoutes } from '../routes/org';
import { clientRoutes } from '../routes/client';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/clients', clientRoutes);

describe('Cross-Organization Security (IDOR Prevention)', () => {
  let demoUserToken: string;
  let viewerUserToken: string;
  let demoOrgClientId: string;
  let _viewerOrgId: string;

  beforeAll(async () => {
    // Set up database and seed data
    const { SimpleSQLiteService } = require('../services/simple-sqlite.cjs');
    const sqliteService = new SimpleSQLiteService();
    
    // Get demo user token (Acme Sales org)
    const demoLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@mudul.com',
        password: 'password'
      });
    
    expect(demoLogin.status).toBe(200);
    demoUserToken = demoLogin.body.accessToken;

    // Get viewer user token (different org if exists, or create test scenario)
    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'viewer@mudul.com',
        password: 'password'
      });
    
    expect(viewerLogin.status).toBe(200);
    viewerUserToken = viewerLogin.body.accessToken;

    // Get a client ID from demo user's org
    const clientsResponse = await request(app)
      .get('/api/org/clients-overview')
      .set('Authorization', `Bearer ${demoUserToken}`);
    
    expect(clientsResponse.status).toBe(200);
    expect(clientsResponse.body.items.length).toBeGreaterThan(0);
    demoOrgClientId = clientsResponse.body.items[0].id;

    await sqliteService.disconnect();
  });

  describe('Client Access Control', () => {
    it('should prevent access to client summary from different org', async () => {
      const response = await request(app)
        .get(`/api/clients/${demoOrgClientId}/summary`)
        .set('Authorization', `Bearer ${viewerUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('CLIENT_NOT_FOUND');
      expect(response.body.message).toBe('Client not found or access denied');
    });

    it('should prevent access to client calls from different org', async () => {
      const response = await request(app)
        .get(`/api/clients/${demoOrgClientId}/calls`)
        .set('Authorization', `Bearer ${viewerUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('CLIENT_NOT_FOUND');
    });

    it('should prevent access to client action items from different org', async () => {
      const response = await request(app)
        .get(`/api/clients/${demoOrgClientId}/action-items`)
        .set('Authorization', `Bearer ${viewerUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('CLIENT_NOT_FOUND');
    });
  });

  describe('Organization Data Isolation', () => {
    it('should return different org summary data for different users', async () => {
      const demoOrgResponse = await request(app)
        .get('/api/org/summary')
        .set('Authorization', `Bearer ${demoUserToken}`);

      const viewerOrgResponse = await request(app)
        .get('/api/org/summary')
        .set('Authorization', `Bearer ${viewerUserToken}`);

      expect(demoOrgResponse.status).toBe(200);
      expect(viewerOrgResponse.status).toBe(200);

      // Data should be different (unless it's the same org, which would be test setup issue)
      // At minimum, they should not contain each other's client data
      const demoClients = await request(app)
        .get('/api/org/clients-overview')
        .set('Authorization', `Bearer ${demoUserToken}`);
      
      const viewerClients = await request(app)
        .get('/api/org/clients-overview')
        .set('Authorization', `Bearer ${viewerUserToken}`);

      expect(demoClients.status).toBe(200);
      expect(viewerClients.status).toBe(200);

      // Ensure clients lists don't overlap (proving org isolation)
      const demoClientIds = new Set(demoClients.body.items.map((c: any) => c.id));
      const viewerClientIds = new Set(viewerClients.body.items.map((c: any) => c.id));
      
      // No client should appear in both orgs
      const overlap = [...demoClientIds].filter(id => viewerClientIds.has(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Invalid Client ID Handling', () => {
    it('should handle non-existent client IDs properly', async () => {
      const fakeClientId = 'non-existent-client-id';
      
      const response = await request(app)
        .get(`/api/clients/${fakeClientId}/summary`)
        .set('Authorization', `Bearer ${demoUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('CLIENT_NOT_FOUND');
    });

    it('should handle malformed client IDs properly', async () => {
      const malformedClientId = 'invalid-format';
      
      const response = await request(app)
        .get(`/api/clients/${malformedClientId}/summary`)
        .set('Authorization', `Bearer ${demoUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('CLIENT_NOT_FOUND');
    });
  });
});