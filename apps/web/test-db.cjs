// Simple test to verify database operations
const { SimpleAuthService } = require('./src/api/services/simple-auth.cjs');
const { SimpleSQLiteService } = require('./src/api/services/simple-sqlite.cjs');

async function test() {
  console.log('🧪 Testing database operations...');

  const authService = new SimpleAuthService();
  const dataService = new SimpleSQLiteService();

  try {
    // Test auth
    console.log('Testing login...');
    const loginResult = await authService.login('demo@mudul.com', 'password', false);
    console.log('✅ Login successful:', {
      user: loginResult.user,
      orgs: loginResult.orgs,
      activeOrgId: loginResult.activeOrgId
    });

    // Test token verification
    console.log('Testing token verification...');
    const userInfo = authService.getUserFromToken(loginResult.accessToken);
    console.log('✅ Token verification successful:', userInfo);

    // Test org summary
    console.log('Testing org summary...');
    const orgSummary = await dataService.getOrgSummary('acme');
    console.log('✅ Org summary:', orgSummary);

    // Test clients overview
    console.log('Testing clients overview...');
    const clientsOverview = await dataService.getClientsOverview('acme');
    console.log('✅ Clients overview:', clientsOverview);

    // Test client summary
    console.log('Testing client summary...');
    const clientSummary = await dataService.getClientSummary('client-acme', 'acme');
    console.log('✅ Client summary:', clientSummary);

    // Test client calls
    console.log('Testing client calls...');
    const clientCalls = await dataService.getClientCalls('client-acme', 'acme', 5);
    console.log('✅ Client calls:', clientCalls);

    // Test action items
    console.log('Testing action items...');
    const actionItems = await dataService.getClientActionItems('client-acme', 'acme');
    console.log('✅ Action items:', actionItems);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await authService.disconnect();
    await dataService.disconnect();
  }
}

test();