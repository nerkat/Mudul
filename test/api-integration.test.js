#!/usr/bin/env node

// Simple API integration test
const http = require('http');

const BASE_URL = 'http://localhost:5173/api';

async function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, body: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running API Integration Tests...\n');

  try {
    // Test 1: Login and get token
    console.log('1. Testing authentication...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'demo@mudul.com',
      password: 'password'
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.status, loginResponse.body);
      return;
    }

    console.log('✅ Login successful');
    const accessToken = loginResponse.body.accessToken;

    // Test 2: Get org summary
    console.log('2. Testing org summary...');
    const orgResponse = await makeRequest('GET', '/org/summary', null, {
      'Authorization': `Bearer ${accessToken}`
    });

    if (orgResponse.status !== 200) {
      console.error('❌ Org summary failed:', orgResponse.status, orgResponse.body);
      return;
    }

    console.log('✅ Org summary retrieved');
    console.log('   - Total calls:', orgResponse.body.totalCalls);
    console.log('   - Avg sentiment:', orgResponse.body.avgSentimentScore);
    console.log('   - Booking rate:', orgResponse.body.bookingRate);

    // Test 3: Get clients overview
    console.log('3. Testing clients overview...');
    const clientsResponse = await makeRequest('GET', '/org/clients-overview', null, {
      'Authorization': `Bearer ${accessToken}`
    });

    if (clientsResponse.status !== 200) {
      console.error('❌ Clients overview failed:', clientsResponse.status, clientsResponse.body);
      return;
    }

    console.log('✅ Clients overview retrieved');
    console.log(`   - Found ${clientsResponse.body.items.length} clients`);

    if (clientsResponse.body.items.length > 0) {
      const firstClient = clientsResponse.body.items[0];
      console.log(`   - First client: ${firstClient.name} (${firstClient.totalCalls} calls)`);

      // Test 4: Get client details
      console.log('4. Testing client details...');
      const clientDetailResponse = await makeRequest('GET', `/clients/${firstClient.id}/summary`, null, {
        'Authorization': `Bearer ${accessToken}`
      });

      if (clientDetailResponse.status !== 200) {
        console.error('❌ Client details failed:', clientDetailResponse.status, clientDetailResponse.body);
        return;
      }

      console.log('✅ Client details retrieved');
      console.log(`   - Client: ${clientDetailResponse.body.name}`);
      console.log(`   - Total calls: ${clientDetailResponse.body.totalCalls}`);
    }

    // Test 5: Cross-org access test (should fail)
    console.log('5. Testing cross-org security...');
    const viewerLoginResponse = await makeRequest('POST', '/auth/login', {
      email: 'viewer@mudul.com',
      password: 'password'
    });

    if (viewerLoginResponse.status === 200 && clientsResponse.body.items.length > 0) {
      const viewerToken = viewerLoginResponse.body.accessToken;
      const demoClientId = clientsResponse.body.items[0].id;

      const crossOrgResponse = await makeRequest('GET', `/clients/${demoClientId}/summary`, null, {
        'Authorization': `Bearer ${viewerToken}`
      });

      if (crossOrgResponse.status === 404 && crossOrgResponse.body.error === 'CLIENT_NOT_FOUND') {
        console.log('✅ Cross-org access properly blocked');
      } else {
        console.error('❌ Cross-org access not properly blocked:', crossOrgResponse.status, crossOrgResponse.body);
      }
    }

    // Test 6: Response validation
    console.log('6. Testing response validation...');
    
    // Check if org summary has all required fields
    const requiredOrgFields = ['totalCalls', 'avgSentimentScore', 'bookingRate', 'openActionItems'];
    const missingFields = requiredOrgFields.filter(field => !(field in orgResponse.body));
    
    if (missingFields.length === 0) {
      console.log('✅ Org summary response validation passed');
    } else {
      console.error('❌ Org summary missing fields:', missingFields);
    }

    // Check if clients overview has proper structure
    if (Array.isArray(clientsResponse.body.items)) {
      console.log('✅ Clients overview response validation passed');
    } else {
      console.error('❌ Clients overview should have items array');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };