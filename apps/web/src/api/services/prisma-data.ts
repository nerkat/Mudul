// Real data service that uses SQLite directly
let SimpleSQLiteService: any;
let sqliteService: any;

// Lazy initialization to avoid SQLite loading during config phase
function getDataService() {
  if (!sqliteService) {
    const { SimpleSQLiteService: DataClass } = require('./simple-sqlite.cjs');
    sqliteService = new DataClass();
  }
  return sqliteService;
}

export class PrismaDataService {
  /**
   * Get organization summary KPIs
   */
  static async getOrgSummary(orgId: string) {
    return await getDataService().getOrgSummary(orgId);
  }

  /**
   * Get clients overview for organization
   */
  static async getClientsOverview(orgId: string) {
    return await getDataService().getClientsOverview(orgId);
  }

  /**
   * Get client summary with KPIs and insights
   */
  static async getClientSummary(clientId: string, orgId: string) {
    return await getDataService().getClientSummary(clientId, orgId);
  }

  /**
   * Get client calls with pagination
   */
  static async getClientCalls(clientId: string, orgId: string, limit = 10) {
    return await getDataService().getClientCalls(clientId, orgId, limit);
  }

  /**
   * Get client action items
   */
  static async getClientActionItems(
    clientId: string, 
    orgId: string, 
    status?: 'open' | 'done'
  ) {
    return await getDataService().getClientActionItems(clientId, orgId, status);
  }

  /**
   * Close SQLite connection
   */
  static async disconnect() {
    if (sqliteService) {
      await sqliteService.disconnect();
    }
  }
}