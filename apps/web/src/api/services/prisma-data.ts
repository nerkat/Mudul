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
   * Close SQLite connection
   */
  static async disconnect() {
    await sqliteService.disconnect();
  }
}