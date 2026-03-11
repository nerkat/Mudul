// Simple SQLite-based data service to replace Prisma temporarily
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Reliable path resolution for different environments
function findDatabasePath() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace('file:', '');
  }
  
  // Try different possible locations
  // __dirname is apps/web/src/api/services, so ../../../../.. is the monorepo root
  // process.cwd() is typically apps/web, so ../.. is the monorepo root
  const possiblePaths = [
    path.join(__dirname, '../../../../../packages/storage/dev.db'),
    path.join(process.cwd(), '../../packages/storage/dev.db'),
    path.join(process.cwd(), 'packages/storage/dev.db'),
    path.join(process.cwd(), 'dev.db'),
  ];
  
  for (const dbPath of possiblePaths) {
    if (fs.existsSync(dbPath)) {
      return dbPath;
    }
  }
  
  // Default to first path if none found (will be created if needed)
  return possiblePaths[0];
}

const dbPath = findDatabasePath();

// Singleton pattern to prevent connection leaks in development
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(dbPath);
  }
  return dbInstance;
}

// Use global variable to persist across hot reloads in development
if (typeof globalThis !== 'undefined') {
  if (!globalThis.__sqliteDb) {
    globalThis.__sqliteDb = getDatabase();
  }
  dbInstance = globalThis.__sqliteDb;
}

class SimpleSQLiteService {
  constructor() {
    this.db = getDatabase();
    this.extendedCallSchemaReady = false;
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

  async ensureExtendedCallSchema() {
    if (this.extendedCallSchemaReady) {
      return;
    }

    const columns = await this.query('PRAGMA table_info(calls)');
    const columnNames = new Set(columns.map((column) => column.name));

    if (!columnNames.has('transcript')) {
      await this.run('ALTER TABLE calls ADD COLUMN transcript TEXT');
    }

    if (!columnNames.has('analysis_json')) {
      await this.run('ALTER TABLE calls ADD COLUMN analysis_json TEXT');
    }

    if (!columnNames.has('meta_json')) {
      await this.run('ALTER TABLE calls ADD COLUMN meta_json TEXT');
    }

    this.extendedCallSchemaReady = true;
  }

  slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled';
  }

  normalizeSentiment(sentiment) {
    const value = String(sentiment || 'neutral').toUpperCase();
    if (value === 'POSITIVE' || value === 'POS') return 'positive';
    if (value === 'NEGATIVE' || value === 'NEG') return 'negative';
    return 'neutral';
  }

  parseJson(value, fallback) {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  buildRootNode(orgId, orgName, createdAt) {
    return {
      id: `root-${orgId}`,
      orgId,
      parentId: null,
      kind: 'group',
      name: orgName,
      slug: this.slugify(orgName),
      dashboardId: 'org-dashboard',
      createdAt,
      updatedAt: createdAt,
    };
  }

  buildClientNode(client, rootId) {
    return {
      id: client.id,
      orgId: client.org_id,
      parentId: rootId,
      kind: 'lead',
      name: client.name,
      slug: client.slug || this.slugify(client.name),
      dashboardId: 'client-dashboard',
      createdAt: client.created_at,
      updatedAt: client.created_at,
    };
  }

  buildCallNode(call) {
    return {
      id: call.id,
      orgId: call.org_id,
      parentId: call.client_id,
      kind: 'call_session',
      name: call.name || 'Untitled Call',
      slug: this.slugify(call.name || call.id),
      dashboardId: 'sales-call-default',
      dataRef: { type: 'session', id: `session-${call.id}` },
      createdAt: call.ts,
      updatedAt: call.created_at || call.ts,
    };
  }

  buildCallData(call) {
    const storedAnalysis = this.parseJson(call.analysis_json, {});
    const storedMeta = this.parseJson(call.meta_json, {});

    return {
      id: call.id,
      transcript: call.transcript || undefined,
      summary: storedAnalysis.summary ?? call.summary ?? undefined,
      sentiment: storedAnalysis.sentiment ?? {
        overall: this.normalizeSentiment(call.sentiment),
        score: call.score ?? 0,
      },
      bookingLikelihood: storedAnalysis.bookingLikelihood ?? call.booking_likelihood ?? 0,
      objections: storedAnalysis.objections ?? [],
      actionItems: storedAnalysis.actionItems ?? [],
      keyMoments: storedAnalysis.keyMoments ?? [],
      entities: storedAnalysis.entities ?? { prospect: [], people: [], products: [] },
      complianceFlags: storedAnalysis.complianceFlags ?? [],
      meta: storedMeta,
    };
  }

  async getOrgTree(orgId) {
    await this.ensureExtendedCallSchema();

    const orgs = await this.query('SELECT id, name, created_at FROM orgs WHERE id = ?', [orgId]);
    if (!orgs || orgs.length === 0) {
      throw new Error('ORG_NOT_FOUND');
    }

    const org = orgs[0];
    const root = this.buildRootNode(org.id, org.name, org.created_at);
    const clientRows = await this.query(
      'SELECT id, org_id, name, slug, created_at FROM clients WHERE org_id = ? ORDER BY created_at ASC, name ASC',
      [orgId]
    );
    const callRows = await this.query(
      `SELECT id, org_id, client_id, name, summary, ts, sentiment, score, booking_likelihood, created_at, transcript, analysis_json, meta_json
       FROM calls
       WHERE org_id = ?
       ORDER BY ts DESC, created_at DESC`,
      [orgId]
    );

    return {
      root,
      clients: clientRows.map((client) => this.buildClientNode(client, root.id)),
      calls: callRows.map((call) => this.buildCallNode(call)),
      callData: Object.fromEntries(callRows.map((call) => [call.id, this.buildCallData(call)])),
    };
  }

  async createClient(orgId, name) {
    const orgs = await this.query('SELECT id FROM orgs WHERE id = ?', [orgId]);
    if (!orgs || orgs.length === 0) {
      throw new Error('ORG_NOT_FOUND');
    }

    const timestamp = new Date().toISOString();
    const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const slug = this.slugify(name);

    await this.run(
      'INSERT INTO clients (id, org_id, name, slug, created_at) VALUES (?, ?, ?, ?, ?)',
      [clientId, orgId, name, slug, timestamp]
    );

    return {
      id: clientId,
      orgId,
      name,
      slug,
      createdAt: timestamp,
    };
  }

  async createCall(orgId, payload) {
    await this.ensureExtendedCallSchema();

    const clients = await this.query(
      'SELECT id FROM clients WHERE id = ? AND org_id = ?',
      [payload.clientId, orgId]
    );
    if (!clients || clients.length === 0) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();
    const analysis = payload.analysis || {};
    const meta = {
      ...(payload.meta || {}),
      updatedAt: timestamp,
    };

    await this.run('BEGIN TRANSACTION');

    try {
      await this.run(
        `INSERT INTO calls (
          id, org_id, client_id, name, summary, ts, sentiment, score, booking_likelihood, created_at, transcript, analysis_json, meta_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          callId,
          orgId,
          payload.clientId,
          payload.title,
          analysis.summary || null,
          timestamp,
          String(analysis.sentiment?.overall || 'neutral').toUpperCase(),
          analysis.sentiment?.score ?? null,
          analysis.bookingLikelihood ?? null,
          timestamp,
          payload.transcript,
          JSON.stringify(analysis),
          JSON.stringify(meta),
        ]
      );

      const actionItems = Array.isArray(analysis.actionItems) ? analysis.actionItems : [];
      for (const item of actionItems) {
        await this.run(
          'INSERT INTO action_items (id, org_id, client_id, text, due, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            orgId,
            payload.clientId,
            item.text,
            item.due || null,
            'OPEN',
            timestamp,
          ]
        );
      }

      await this.run('COMMIT');
    } catch (error) {
      await this.run('ROLLBACK').catch(() => {});
      throw error;
    }

    const createdRows = await this.query(
      `SELECT id, org_id, client_id, name, summary, ts, sentiment, score, booking_likelihood, created_at, transcript, analysis_json, meta_json
       FROM calls WHERE id = ?`,
      [callId]
    );
    const createdCall = createdRows[0];

    return {
      node: this.buildCallNode(createdCall),
      data: this.buildCallData(createdCall),
    };
  }

  /**
   * Get organization summary KPIs
   */
  async getOrgSummary(orgId) {
    await this.ensureExtendedCallSchema();

    // Verify org exists
    const orgs = await this.query('SELECT id FROM orgs WHERE id = ?', [orgId]);
    if (!orgs || orgs.length === 0) {
      throw new Error('ORG_NOT_FOUND');
    }

    const totalCalls = await this.query(
      'SELECT COUNT(*) as count FROM calls WHERE org_id = ?',
      [orgId]
    );

    const sentimentAvg = await this.query(
      'SELECT AVG(score) as avg_score FROM calls WHERE org_id = ? AND score IS NOT NULL',
      [orgId]
    );

    const highLikelihoodCalls = await this.query(
      'SELECT COUNT(*) as count FROM calls WHERE org_id = ? AND booking_likelihood >= 0.7',
      [orgId]
    );

    const openActionItems = await this.query(
      'SELECT COUNT(*) as count FROM action_items WHERE org_id = ? AND status = "OPEN"',
      [orgId]
    );

    const total = totalCalls[0]?.count || 0;
    const avgScore = sentimentAvg[0]?.avg_score || 0;
    const highLikelihood = highLikelihoodCalls[0]?.count || 0;
    const openItems = openActionItems[0]?.count || 0;

    return {
      totalCalls: total,
      avgSentimentScore: Math.round((avgScore || 0) * 100) / 100, // Round to 2 decimals
      bookingRate: Math.round((total > 0 ? highLikelihood / total : 0) * 100) / 100, // Round to 2 decimals
      openActionItems: openItems,
    };
  }

  /**
   * Get clients overview for organization
   */
  async getClientsOverview(orgId) {
    await this.ensureExtendedCallSchema();

    // Verify org exists
    const orgs = await this.query('SELECT id FROM orgs WHERE id = ?', [orgId]);
    if (!orgs || orgs.length === 0) {
      throw new Error('ORG_NOT_FOUND');
    }

    const clients = await this.query(
      'SELECT id, name FROM clients WHERE org_id = ?',
      [orgId]
    );

    const items = await Promise.all(
      clients.map(async (client) => {
        const lastCall = await this.query(
          'SELECT ts FROM calls WHERE client_id = ? ORDER BY ts DESC LIMIT 1',
          [client.id]
        );

        // Get calls in last 30 days for sorting
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const calls30d = await this.query(
          'SELECT COUNT(*) as calls30d FROM calls WHERE client_id = ? AND ts >= ?',
          [client.id, thirtyDaysAgo]
        );

        const callStats = await this.query(
          `SELECT 
            COUNT(*) as total_calls,
            AVG(score) as avg_sentiment,
            AVG(booking_likelihood) as avg_likelihood
           FROM calls WHERE client_id = ?`,
          [client.id]
        );

        const stats = callStats[0] || {};

        return {
          id: client.id,
          name: client.name,
          lastCallDate: lastCall[0]?.ts || null,
          totalCalls: stats.total_calls || 0,
          avgSentiment: Math.round((stats.avg_sentiment || 0) * 100) / 100, // Round to 2 decimals
          bookingLikelihood: Math.round((stats.avg_likelihood || 0) * 100) / 100, // Round to 2 decimals
          calls30d: calls30d[0]?.calls30d || 0, // For sorting
        };
      })
    );

    // Sort by calls in last 30 days descending (most active clients first)
    items.sort((a, b) => b.calls30d - a.calls30d);

    // Remove the sorting field from response
    const cleanItems = items.map(({ calls30d, ...item }) => item);

    return { items: cleanItems };
  }

  /**
   * Get client summary with KPIs and insights
   */
  async getClientSummary(clientId, orgId) {
    await this.ensureExtendedCallSchema();

    const client = await this.query(
      'SELECT * FROM clients WHERE id = ? AND org_id = ?',
      [clientId, orgId]
    );

    if (!client || client.length === 0) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const callStats = await this.query(
      `SELECT 
        COUNT(*) as total_calls,
        AVG(score) as avg_sentiment,
        AVG(booking_likelihood) as avg_likelihood
       FROM calls WHERE client_id = ?`,
      [clientId]
    );

    const stats = callStats[0] || {};

    return {
      id: client[0].id,
      name: client[0].name,
      totalCalls: stats.total_calls || 0,
      avgSentiment: Math.round((stats.avg_sentiment || 0) * 100) / 100, // Round to 2 decimals
      bookingLikelihood: Math.round((stats.avg_likelihood || 0) * 100) / 100, // Round to 2 decimals
      topObjections: [], // TODO: Implement objections analysis
    };
  }

  /**
   * Get client calls with pagination
   */
  async getClientCalls(clientId, orgId, limit = 10) {
    await this.ensureExtendedCallSchema();

    // Verify client belongs to org
    const client = await this.query(
      'SELECT id FROM clients WHERE id = ? AND org_id = ?',
      [clientId, orgId]
    );

    if (!client || client.length === 0) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const calls = await this.query(
      'SELECT * FROM calls WHERE client_id = ? ORDER BY ts DESC, id DESC LIMIT ?',
      [clientId, limit]
    );

    const items = calls.map((call) => ({
      id: call.id,
      name: call.name || 'Untitled Call',
      date: call.ts,
      sentiment: this.normalizeSentiment(call.sentiment),
      score: Math.round((call.score || 0) * 100) / 100, // Round to 2 decimals
      bookingLikelihood: Math.round((call.booking_likelihood || 0) * 100) / 100, // Round to 2 decimals
    }));

    return { items };
  }

  /**
   * Get client action items
   */
  async getClientActionItems(clientId, orgId, status) {
    await this.ensureExtendedCallSchema();

    // Verify client belongs to org
    const client = await this.query(
      'SELECT id FROM clients WHERE id = ? AND org_id = ?',
      [clientId, orgId]
    );

    if (!client || client.length === 0) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    let sql = `
      SELECT ai.*, u.name as owner_name 
      FROM action_items ai 
      LEFT JOIN users u ON ai.owner_id = u.id 
      WHERE ai.client_id = ?
    `;
    const params = [clientId];

    if (status) {
      sql += ' AND ai.status = ?';
      params.push(status.toUpperCase());
    }

    sql += ' ORDER BY ai.created_at DESC';

    const actionItems = await this.query(sql, params);

    const items = actionItems.map((item) => ({
      id: item.id,
      text: item.text,
      due: item.due,
      status: item.status.toLowerCase(),
      ownerName: item.owner_name || null,
    }));

    return { items };
  }

  async disconnect() {
    return new Promise((resolve) => {
      this.db.close(resolve);
    });
  }
}

module.exports = { SimpleSQLiteService };