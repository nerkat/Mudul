// Simple SQLite-based data service to replace Prisma temporarily
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = '/home/runner/work/Mudul/Mudul/packages/storage/dev.db';

class SimpleSQLiteService {
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

  /**
   * Get organization summary KPIs
   */
  async getOrgSummary(orgId) {
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
      avgSentimentScore: avgScore,
      bookingRate: total > 0 ? highLikelihood / total : 0,
      openActionItems: openItems,
    };
  }

  /**
   * Get clients overview for organization
   */
  async getClientsOverview(orgId) {
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
          avgSentiment: stats.avg_sentiment || 0,
          bookingLikelihood: stats.avg_likelihood || 0,
        };
      })
    );

    return { items };
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
      avgSentiment: stats.avg_sentiment || 0,
      bookingLikelihood: stats.avg_likelihood || 0,
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
      'SELECT * FROM calls WHERE client_id = ? ORDER BY ts DESC LIMIT ?',
      [clientId, limit]
    );

    const items = calls.map((call) => ({
      id: call.id,
      name: call.name || 'Untitled Call',
      date: call.ts,
      sentiment: call.sentiment.toLowerCase(),
      score: call.score || 0,
      bookingLikelihood: call.booking_likelihood || 0,
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
}

module.exports = { SimpleSQLiteService };