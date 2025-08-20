// Database health check service
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { SimpleSQLiteService } = require('./simple-sqlite.cjs');

export class DatabaseHealthService {
  private static service: any = null;

  private static getService() {
    if (!this.service) {
      this.service = new SimpleSQLiteService();
    }
    return this.service;
  }

  /**
   * Check database readiness including connectivity and migrations
   */
  static async checkReadiness() {
    const result = {
      healthy: false,
      database: { connected: false, responseTime: 0 },
      migrations: { applied: false, count: 0 },
      errors: [] as string[],
    };

    try {
      // Test database connectivity with simple query
      const startTime = Date.now();
      const service = this.getService();
      
      // Check if basic tables exist (indicates migrations are applied)
      const tables = await service.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('users', 'orgs', 'clients', 'calls', 'action_items')
      `);
      
      const responseTime = Date.now() - startTime;
      
      result.database.connected = true;
      result.database.responseTime = responseTime;
      
      // Check if all required tables exist
      const expectedTables = ['users', 'orgs', 'clients', 'calls', 'action_items'];
      const existingTables = tables.map((t: any) => t.name);
      const missingTables = expectedTables.filter(t => !existingTables.includes(t));
      
      if (missingTables.length === 0) {
        result.migrations.applied = true;
        result.migrations.count = existingTables.length;
        result.healthy = true;
      } else {
        result.errors.push(`Missing tables: ${missingTables.join(', ')}`);
      }
      
    } catch (error: any) {
      result.errors.push(`Database connection failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Simple database ping
   */
  static async ping() {
    try {
      const service = this.getService();
      await service.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
}