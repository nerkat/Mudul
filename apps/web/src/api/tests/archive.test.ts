import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authRoutes } from '../routes/auth';
import { callRoutes } from '../routes/call';
import { clientRoutes } from '../routes/client';
import { orgRoutes } from '../routes/org';

function googleCredential(email: string, name = 'Archive Test User'): string {
  return `test-google-token:${encodeURIComponent(email)}:${encodeURIComponent(name)}`;
}

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/calls', callRoutes);

describe('Archive routes', () => {
  let sqliteService: any;
  let userToken: string;
  let orgId: string;
  let clientId: string;
  let callId: string;
  let clientOnlyId: string;
  let nestedCallId: string;

  beforeAll(async () => {
    const { SimpleSQLiteService } = require('../services/simple-sqlite.cjs');
    sqliteService = new SimpleSQLiteService();
    await sqliteService.ensureExtendedCallSchema();

    const loginResponse = await request(app)
      .post('/api/auth/google')
      .send({
        credential: googleCredential('archive@mudul.com'),
        rememberMe: true,
      });

    expect(loginResponse.status).toBe(200);
    userToken = loginResponse.body.accessToken;
    orgId = loginResponse.body.activeOrgId;

    const suffix = Date.now().toString();
    clientId = `archive-test-client-${suffix}`;
    callId = `archive-test-call-${suffix}`;
    clientOnlyId = `archive-test-client-with-child-${suffix}`;
    nestedCallId = `archive-test-child-call-${suffix}`;

    await sqliteService.run(
      'INSERT INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
      [clientId, orgId, 'Archive Target Client', `archive-target-client-${suffix}`]
    );
    await sqliteService.run(
      'INSERT INTO calls (id, org_id, client_id, name, ts, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [callId, orgId, clientId, 'Archive Target Call', new Date('2025-01-01T10:00:00Z').toISOString(), 'NEUTRAL', 0.5, 0.4]
    );

    await sqliteService.run(
      'INSERT INTO clients (id, org_id, name, slug) VALUES (?, ?, ?, ?)',
      [clientOnlyId, orgId, 'Archive Parent Client', `archive-parent-client-${suffix}`]
    );
    await sqliteService.run(
      'INSERT INTO calls (id, org_id, client_id, name, ts, sentiment, score, booking_likelihood) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nestedCallId, orgId, clientOnlyId, 'Archive Nested Call', new Date('2025-01-02T10:00:00Z').toISOString(), 'POSITIVE', 0.7, 0.8]
    );
  });

  afterAll(async () => {
    await sqliteService.run('DELETE FROM calls WHERE id IN (?, ?)', [callId, nestedCallId]);
    await sqliteService.run('DELETE FROM clients WHERE id IN (?, ?)', [clientId, clientOnlyId]);
    await sqliteService.disconnect();
  });

  it('archives a call and removes it from org tree responses', async () => {
    const archiveResponse = await request(app)
      .post(`/api/calls/${callId}/archive`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.body).toMatchObject({ id: callId });
    expect(archiveResponse.body.archivedAt).toEqual(expect.any(String));

    const treeResponse = await request(app)
      .get('/api/org/tree')
      .set('Authorization', `Bearer ${userToken}`);

    expect(treeResponse.status).toBe(200);
    expect(treeResponse.body.calls.some((call: { id: string }) => call.id === callId)).toBe(false);
    expect(treeResponse.body.clients.some((client: { id: string }) => client.id === clientId)).toBe(true);
  });

  it('archives a client and removes both client and child calls from org tree responses', async () => {
    const archiveResponse = await request(app)
      .post(`/api/clients/${clientOnlyId}/archive`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.body).toMatchObject({ id: clientOnlyId });
    expect(archiveResponse.body.archivedAt).toEqual(expect.any(String));

    const treeResponse = await request(app)
      .get('/api/org/tree')
      .set('Authorization', `Bearer ${userToken}`);

    expect(treeResponse.status).toBe(200);
    expect(treeResponse.body.clients.some((client: { id: string }) => client.id === clientOnlyId)).toBe(false);
    expect(treeResponse.body.calls.some((call: { id: string }) => call.id === nestedCallId)).toBe(false);
  });
});