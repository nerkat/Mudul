// Simple SQLite-based data service to replace Prisma temporarily
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Reliable path resolution for different environments
function findDatabasePath() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace('file:', '');
  }
  
  // Try different possible locations
  const possiblePaths = [
    path.join(process.cwd(), 'packages/storage/dev.db'),
    path.join(__dirname, '../../../packages/storage/dev.db'),
    path.join(__dirname, '../../packages/storage/dev.db'),
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

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            reject(err);
            return;
          }

          const results = [];
          let queryIndex = 0;

          const executeNext = () => {
            if (queryIndex >= queries.length) {
              // All queries executed successfully, commit
              this.db.run('COMMIT', (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(results);
                }
              });
              return;
            }

            const { sql, params = [], type = 'run' } = queries[queryIndex];
            
            if (type === 'query') {
              this.db.all(sql, params, (err, rows) => {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                } else {
                  results.push(rows);
                  queryIndex++;
                  executeNext();
                }
              });
            } else {
              this.db.run(sql, params, function(err) {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                } else {
                  results.push({ changes: this.changes, lastID: this.lastID });
                  queryIndex++;
                  executeNext();
                }
              });
            }
          };

          executeNext();
        });
      });
    });
  }

  /**
   * Get organization summary KPIs
   */
  async getOrgSummary(orgId) {
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
      sentiment: call.sentiment.toLowerCase(),
      score: Math.round((call.score || 0) * 100) / 100, // Round to 2 decimals
      bookingLikelihood: Math.round((call.booking_likelihood || 0) * 100) / 100, // Round to 2 decimals
    }));

    return { items };
  }

  /**
   * Get client action items
   */
  async getClientActionItems(clientId, orgId, status) {
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

  /**
   * Create a new client
   */
  async createClient(orgId, data) {
    // Verify org exists
    const orgs = await this.query('SELECT id FROM orgs WHERE id = ?', [orgId]);
    if (!orgs || orgs.length === 0) {
      throw new Error('ORG_NOT_FOUND');
    }

    // Check for duplicate client name within org
    const existing = await this.query(
      'SELECT id FROM clients WHERE org_id = ? AND name = ?',
      [orgId, data.name]
    );
    if (existing && existing.length > 0) {
      throw new Error('CLIENT_NAME_EXISTS');
    }

    const clientId = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(
      'INSERT INTO clients (id, org_id, name, slug, created_at) VALUES (?, ?, ?, ?, ?)',
      [clientId, orgId, data.name, data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), now]
    );

    return {
      id: clientId,
      name: data.name,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Create a new call
   */
  async createCall(clientId, orgId, data) {
    // Verify client exists and belongs to org
    const client = await this.query(
      'SELECT id FROM clients WHERE id = ? AND org_id = ?',
      [clientId, orgId]
    );
    if (!client || client.length === 0) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const callId = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(
      'INSERT INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        callId, 
        orgId, 
        clientId, 
        `Call ${new Date(data.ts).toLocaleDateString()}`,
        data.notes || null,
        data.ts,
        data.durationSec,
        data.sentiment.toUpperCase(),
        data.score,
        data.bookingLikelihood,
        now
      ]
    );

    return {
      id: callId,
      clientId,
      ts: data.ts,
      durationSec: data.durationSec,
      sentiment: data.sentiment,
      score: data.score,
      bookingLikelihood: data.bookingLikelihood,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Create a new action item
   */
  async createActionItem(clientId, orgId, data) {
    // Verify client exists and belongs to org
    const client = await this.query(
      'SELECT id FROM clients WHERE id = ? AND org_id = ?',
      [clientId, orgId]
    );
    if (!client || client.length === 0) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const actionItemId = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(
      'INSERT INTO action_items (id, org_id, client_id, owner_id, text, due, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        actionItemId,
        orgId,
        clientId,
        null, // We'll use owner text field for now instead of FK
        data.text,
        data.dueDate || null,
        'OPEN',
        now
      ]
    );

    return {
      id: actionItemId,
      clientId,
      owner: data.owner || null,
      text: data.text,
      due: data.dueDate || null,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Atomic operation: Create call and action item together
   * Example of transaction usage for future multi-entity operations
   */
  async createCallWithActionItem(clientId, orgId, callData, actionItemData) {
    // Verify client exists and belongs to org
    const client = await this.query(
      'SELECT id FROM clients WHERE id = ? AND org_id = ?',
      [clientId, orgId]
    );
    if (!client || client.length === 0) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const callId = uuidv4();
    const actionItemId = uuidv4();
    const now = new Date().toISOString();

    const queries = [
      {
        sql: 'INSERT INTO calls (id, org_id, client_id, name, summary, ts, duration_sec, sentiment, score, booking_likelihood, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [
          callId, 
          orgId, 
          clientId, 
          `Call ${new Date(callData.ts).toLocaleDateString()}`,
          callData.notes || null,
          callData.ts,
          callData.durationSec,
          callData.sentiment.toUpperCase(),
          callData.score,
          callData.bookingLikelihood,
          now
        ],
        type: 'run'
      },
      {
        sql: 'INSERT INTO action_items (id, org_id, client_id, owner_id, text, due, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        params: [
          actionItemId,
          orgId,
          clientId,
          null,
          actionItemData.text,
          actionItemData.dueDate || null,
          'OPEN',
          now
        ],
        type: 'run'
      }
    ];

    await this.transaction(queries);

    return {
      call: {
        id: callId,
        clientId,
        ts: callData.ts,
        durationSec: callData.durationSec,
        sentiment: callData.sentiment,
        score: callData.score,
        bookingLikelihood: callData.bookingLikelihood,
        notes: callData.notes || null,
        createdAt: now,
        updatedAt: now,
      },
      actionItem: {
        id: actionItemId,
        clientId,
        owner: actionItemData.owner || null,
        text: actionItemData.text,
        due: actionItemData.dueDate || null,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      }
    };
  }
}

module.exports = { SimpleSQLiteService };