# PostgreSQL Setup Guide

This guide explains how to switch from SQLite (development) to PostgreSQL (production).

## Quick Setup

1. **Install PostgreSQL** (if not already installed)
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   
   # macOS with Homebrew
   brew install postgresql
   
   # Windows - Download from postgresql.org
   ```

2. **Create Database and User**
   ```sql
   -- Connect as postgres superuser
   sudo -u postgres psql
   
   -- Create database
   CREATE DATABASE mudul_app;
   
   -- Create user with password
   CREATE USER mudul_user WITH PASSWORD 'secure_password_here';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE mudul_app TO mudul_user;
   
   -- Exit
   \q
   ```

3. **Update Environment Variables**
   ```bash
   # .env.production
   DATABASE_URL="postgresql://mudul_user:secure_password_here@localhost:5432/mudul_app"
   NODE_ENV="production"
   ```

## Schema Differences

### SQLite vs PostgreSQL Considerations

1. **Case Sensitivity**
   - SQLite: Case-insensitive by default
   - PostgreSQL: Case-sensitive, use `CITEXT` or `LOWER()` for case-insensitive email matching

2. **Data Types**
   - SQLite: Dynamic typing
   - PostgreSQL: Strict typing - ensure proper type casting

3. **Boolean Values**
   - SQLite: 0/1 integers
   - PostgreSQL: true/false booleans

4. **Transactions**
   - SQLite: Automatic locking
   - PostgreSQL: MVCC, better concurrent access

## Production Configuration

### Connection Pooling
```typescript
// For production, consider using connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### SSL Configuration
```bash
# For production databases, enable SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Performance Optimization
```sql
-- Add indexes for production (already in schema.prisma)
CREATE INDEX CONCURRENTLY idx_clients_org_calls ON calls(org_id, client_id, ts);
CREATE INDEX CONCURRENTLY idx_action_items_org_status ON action_items(org_id, status, due);

-- Analyze tables for query optimization
ANALYZE;
```

## Migration from SQLite

1. **Export SQLite Data**
   ```bash
   sqlite3 dev.db .dump > sqlite_dump.sql
   ```

2. **Convert to PostgreSQL Format**
   ```bash
   # Remove SQLite-specific syntax and adjust data types
   sed -i 's/INTEGER PRIMARY KEY AUTOINCREMENT/SERIAL PRIMARY KEY/g' sqlite_dump.sql
   sed -i 's/BEGIN TRANSACTION/BEGIN/g' sqlite_dump.sql
   ```

3. **Import to PostgreSQL**
   ```bash
   psql -U mudul_user -d mudul_app -f sqlite_dump.sql
   ```

## Health Monitoring

The health endpoints (`/api/health/readyz`) automatically adapt to PostgreSQL:

- Database connectivity tests work with both SQLite and PostgreSQL
- Migration status checking validates table existence
- Response time monitoring helps detect performance issues

## Backup Strategy

```bash
# Daily backup script
pg_dump -U mudul_user mudul_app > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U mudul_user mudul_app < backup_20240115.sql
```

## Environment-Specific Scripts

The database scripts automatically detect the environment:

- `NODE_ENV=development`: Uses SQLite for local development
- `NODE_ENV=production`: Expects PostgreSQL configuration
- `NODE_ENV=test`: Can use either, typically in-memory or test database

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check PostgreSQL service is running: `sudo systemctl status postgresql`
   - Verify port 5432 is open
   - Check connection string format

2. **Permission Denied**
   - Ensure user has proper database privileges
   - Check pg_hba.conf for authentication settings

3. **SSL Errors**
   - For development: Set `sslmode=disable`
   - For production: Obtain proper SSL certificates

4. **Performance Issues**
   - Run `EXPLAIN ANALYZE` on slow queries
   - Check if indexes are being used
   - Monitor connection pool utilization

For detailed PostgreSQL configuration, see the [official documentation](https://www.postgresql.org/docs/).