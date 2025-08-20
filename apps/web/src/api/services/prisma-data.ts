// Real data service that uses SQLite directly
const { SimpleSQLiteService } = require('./simple-sqlite.cjs');

// Initialize service
const sqliteService = new SimpleSQLiteService();

export class PrismaDataService {
  /**
   * Get organization summary KPIs
   */
  static async getOrgSummary(orgId: string) {
    return await sqliteService.getOrgSummary(orgId);
  }

  /**
   * Get clients overview for organization
   */
  static async getClientsOverview(orgId: string) {
    return await sqliteService.getClientsOverview(orgId);
  }

  /**
   * Get client summary with KPIs and insights
   */
  static async getClientSummary(clientId: string, orgId: string) {
    return await sqliteService.getClientSummary(clientId, orgId);
  }

  /**
   * Get client calls with pagination
   */
  static async getClientCalls(clientId: string, orgId: string, limit = 10) {
    return await sqliteService.getClientCalls(clientId, orgId, limit);
  }

  /**
   * Get client action items
   */
  static async getClientActionItems(
    clientId: string, 
    orgId: string, 
    status?: 'open' | 'done'
  ) {
    return await sqliteService.getClientActionItems(clientId, orgId, status);
  }

  /**
   * Create a new client
   */
  static async createClient(orgId: string, data: { name: string; notes?: string }) {
    return await sqliteService.createClient(orgId, data);
  }

  /**
   * Create a new call
   */
  static async createCall(clientId: string, orgId: string, data: {
    ts: string;
    durationSec: number;
    sentiment: 'pos' | 'neu' | 'neg';
    score: number;
    bookingLikelihood: number;
    notes?: string;
  }) {
    return await sqliteService.createCall(clientId, orgId, data);
  }

  /**
   * Create a new action item
   */
  static async createActionItem(clientId: string, orgId: string, data: {
    owner?: string;
    text: string;
    dueDate?: string;
  }) {
    return await sqliteService.createActionItem(clientId, orgId, data);
  }

  /**
   * Close SQLite connection
   */
  static async disconnect() {
    await sqliteService.disconnect();
  }
}