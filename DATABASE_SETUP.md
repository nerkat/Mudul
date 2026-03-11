# Mudul Database Setup

This guide explains how to set up and use the database for the Mudul application.

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Clone and navigate to the project
cd Mudul

# 2. Copy environment files
cp packages/storage/.env.example packages/storage/.env
cp apps/web/.env.example apps/web/.env

# 3. Set up the database
npm run db:setup

# 4. Start the development server
cd apps/web && npm run dev
```

**Login Method:**
- Google Sign-In via the configured OAuth client

That's it! You should now have a fully functional Mudul instance with demo data.

---

## Overview

The application has been migrated from in-memory mock data to a real database using:
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **ORM**: Prisma (schema defined, alternative SQLite implementation for immediate use)
- **Authentication**: Google Sign-In + JWT tokens
- **Validation**: Zod schemas for API responses

## Database Schema

The database includes the following main entities:
- **Users**: Authentication and user profiles
- **Organizations**: Company/team entities
- **Memberships**: User-organization relationships with roles
- **Clients**: Sales prospects/customers  
- **Calls**: Sales call records with sentiment analysis
- **Action Items**: Follow-up tasks and todos
- **Refresh Tokens**: JWT token management

## Setup Instructions

### 1. Initial Database Setup

```bash
# From project root
npm run db:setup
```

This creates the SQLite database and seeds it with demo data.

### 2. Reset Database (if needed)

```bash
# From project root  
npm run db:reset
```

This deletes the existing database and recreates it with fresh demo data.

### 3. Environment Variables

The following environment variables are used:

**packages/storage/.env**:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-change-in-production"
GOOGLE_CLIENT_ID="your-google-web-client-id.apps.googleusercontent.com"
```

**apps/web/.env**:
```
DATABASE_URL="file:../../packages/storage/dev.db"
JWT_SECRET="dev-secret-key-change-in-production"
GOOGLE_CLIENT_ID="your-google-web-client-id.apps.googleusercontent.com"
VITE_GOOGLE_CLIENT_ID="your-google-web-client-id.apps.googleusercontent.com"
```

## Demo Data

The seeded database includes:

### Users
- Existing seeded users remain available for backend compatibility and tests
- New browser logins are provisioned through Google Sign-In

### Organizations
- **Acme Sales Org** (ID: `acme-sales-org`) with 3 clients and 5 calls
- **Viewer Test Org** (ID: `viewer-org`) with 1 client and 1 call (for cross-org testing)

### Clients
- **Acme Corp**: 2 calls, high booking likelihood
- **Beta Systems**: 2 calls, moderate sentiment  
- **Gamma Industries**: 1 call, good potential

## API Authentication

All API endpoints require JWT authentication:

1. Sign in via `POST /api/auth/google` with a Google credential token, or use the browser login page
2. Include token in `Authorization: Bearer <token>` header
3. Refresh tokens via `POST /api/auth/refresh` when needed

## Data Access Security

- All data is **organization-scoped** - users can only access data for orgs they belong to
- Client data requires both client ID and organization validation
- Attempting to access data from other organizations returns 404/403 errors
- Invalid organizations are rejected with `ORG_NOT_FOUND` errors

## API Endpoints

### Authentication
- `POST /api/auth/google` - Login with a Google credential token
- `POST /api/auth/refresh` - Refresh access token  
- `POST /api/auth/logout` - Logout and revoke refresh token

### Organization Data
- `GET /api/org/summary` - Organization KPIs and metrics
- `GET /api/org/clients-overview` - All clients with summary stats

### Client Data  
- `GET /api/clients/:id/summary` - Client KPIs and insights
- `GET /api/clients/:id/calls` - Recent calls for client
- `GET /api/clients/:id/action-items` - Action items for client

## Response Validation

All API responses are validated using Zod schemas to ensure:
- Correct data types and structure
- Required fields are present  
- No unexpected extra fields (strict mode)
- Consistent response formats

## Testing

### Database Operations
```bash
cd apps/web
node test-db.cjs
```

### Security (Org Scoping)
```bash  
cd apps/web
node test-security.cjs
```

### Validation
```bash
cd apps/web  
node test-validation-simple.cjs
```

## Migration from Mock Data

The application has been fully migrated from mock data to real database:

✅ **Completed**:
- Database schema and seeding
- Google credential verification with automatic user provisioning
- JWT token generation and refresh
- Organization-scoped data access
- All API endpoints using real database queries
- Zod response validation
- Security testing and validation

**Benefits**:
- Real persistent data storage
- Proper authentication and security
- Scalable database architecture  
- Production-ready data model
- Strict API response contracts

## Production Considerations

For production deployment:

1. **Use PostgreSQL**: Update `DATABASE_URL` to PostgreSQL connection string
2. **Secure JWT_SECRET**: Use a strong random secret
3. **Environment Variables**: Set proper production environment variables
4. **Database Migrations**: Use Prisma migrations for schema changes
5. **Connection Pooling**: Configure database connection pooling
6. **Backups**: Set up regular database backups

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct in environment files
- Ensure SQLite file exists and is readable
- Check file permissions on database file

### Authentication Issues  
- Verify JWT_SECRET matches between components
- Check token expiration times
- Ensure refresh tokens are properly stored

### Data Access Issues
- Verify user has proper organization membership
- Check organization ID in JWT payload
- Ensure client belongs to correct organization