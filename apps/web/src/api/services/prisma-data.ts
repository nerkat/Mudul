// Real data service that uses SQLite directly
// Note: Vite bundles its config as ESM; using Node's `createRequire` ensures
// the native sqlite3 dependency is loaded via real CJS `require` (not a shim).
import { createRequire } from 'node:module';
import { MockDataService } from './data';

export class PrismaDataService {
  private static service: any = null;
  private static warned = false;

  private static getService() {
    if (!this.service) {
      try {
        const require = createRequire(import.meta.url);
        const { SimpleSQLiteService } = require('./simple-sqlite.cjs') as { SimpleSQLiteService: any };
        this.service = new SimpleSQLiteService();
      } catch (error) {
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }

        if (!this.warned) {
          console.warn('[PrismaDataService] SQLite data unavailable; falling back to MockDataService in non-production.');
          this.warned = true;
        }

        this.service = {
          getOrgSummary: MockDataService.getOrgSummary,
          getClientsOverview: MockDataService.getClientsOverview,
          getClientSummary: MockDataService.getClientSummary,
          getClientCalls: MockDataService.getClientCalls,
          getClientActionItems: MockDataService.getClientActionItems,
          disconnect: async () => {},
        };
      }
    }
    return this.service;
  }

  /**
   * Get organization summary KPIs
   */
  static async getOrgSummary(orgId: string) {
    return await this.getService().getOrgSummary(orgId);
  }

  /**
   * Get clients overview for organization
   */
  static async getClientsOverview(orgId: string) {
    return await this.getService().getClientsOverview(orgId);
  }

  /**
   * Get client summary with KPIs and insights
   */
  static async getClientSummary(clientId: string, orgId: string) {
    return await this.getService().getClientSummary(clientId, orgId);
  }

  /**
   * Get client calls with pagination
   */
  static async getClientCalls(clientId: string, orgId: string, limit = 10) {
    return await this.getService().getClientCalls(clientId, orgId, limit);
  }

  /**
   * Get client action items
   */
  static async getClientActionItems(
    clientId: string, 
    orgId: string, 
    status?: 'open' | 'done'
  ) {
    return await this.getService().getClientActionItems(clientId, orgId, status);
  }

  /**
   * Close SQLite connection
   */
  static async disconnect() {
    if (!this.service) return;
    await this.service.disconnect();
    this.service = null;
  }
}