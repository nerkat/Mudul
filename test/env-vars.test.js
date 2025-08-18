#!/usr/bin/env node

/**
 * Test script to verify dual environment variable support for AI provider selection
 * This test validates the fix for GitHub issue #47
 */

async function testUseLiveVarOnly() {
  console.log('🧪 Testing USE_LIVE_AI environment variable support...');

  try {
    const { validateProviderConfig, getProviderInfo } = await import('../packages/core/dist/index.js');

    // Test 1: USE_LIVE_AI=true enables live mode
    console.log('\n📝 Test 1: USE_LIVE_AI=true');
    const info1 = getProviderInfo({ USE_LIVE_AI: 'true' });
    console.log(info1.useLive ? '✅' : '❌', `useLive should be true: ${info1.useLive}`);

    // Test 2: USE_LIVE_AI=false disables live mode
    console.log('\n📝 Test 2: USE_LIVE_AI=false');
    const info2 = getProviderInfo({ USE_LIVE_AI: 'false' });
    console.log(!info2.useLive ? '✅' : '❌', `useLive should be false: ${info2.useLive}`);

    // Test 3: Missing variable defaults to false
    console.log('\n📝 Test 3: Missing USE_LIVE_AI');
    const info3 = getProviderInfo({});
    console.log(!info3.useLive ? '✅' : '❌', `useLive should be false: ${info3.useLive}`);

    // Test 4: Case insensitive TRUE
    console.log('\n📝 Test 4: USE_LIVE_AI=TRUE (case insensitive)');
    const info4 = getProviderInfo({ USE_LIVE_AI: 'TRUE' });
    console.log(info4.useLive ? '✅' : '❌', `useLive should be true: ${info4.useLive}`);

    // Test 5: Warning when API key missing
    console.log('\n📝 Test 5: Warning when API key missing');
    const config5 = validateProviderConfig({ USE_LIVE_AI: 'true' });
    const hasWarning = config5.warnings.some(w => w.includes('OPENAI_API_KEY'));
    console.log(hasWarning ? '✅' : '❌', `Should warn about missing API key: ${hasWarning}`);

    const allPassed = info1.useLive && !info2.useLive && !info3.useLive && info4.useLive && hasWarning;
    console.log(`\n📊 USE_LIVE_AI Tests: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    return allPassed;
  } catch (error) {
    console.log('❌ Failed to test USE_LIVE_AI only support:', error.message);
    return false;
  }
}

async function testProviderCreation() {
  console.log('\n🧪 Testing provider creation with dual env vars...');
  
  try {
    const { createProvider, MockAiProvider } = await import('../packages/core/dist/index.js');
    
    // Test that both env vars create mock provider when no API key
    const provider1 = createProvider({ USE_LIVE_AI: 'true' });
    const provider2 = createProvider({ VITE_USE_LIVE_AI: 'true' });
    
    // Both should return MockAiProvider since no API key
    const isMock1 = provider1.constructor.name === 'MockAiProvider';
    const isMock2 = provider2.constructor.name === 'MockAiProvider';
    
    console.log(isMock1 ? '✅' : '❌', `USE_LIVE_AI=true without key should create MockAiProvider: ${isMock1}`);
    console.log(isMock2 ? '✅' : '❌', `VITE_USE_LIVE_AI=true without key should create MockAiProvider: ${isMock2}`);
    
    return isMock1 && isMock2;
    
  } catch (error) {
    console.log('❌ Failed to test provider creation:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Running Environment Variable Fix Tests\n');
  
  const envTest = await testUseLiveVarOnly();
  const providerTest = await testProviderCreation();
  
  const allPassed = envTest && providerTest;
  
  console.log('\n📊 Final Results:');
  console.log(envTest ? '✅' : '❌', 'USE_LIVE_AI variable support');
  console.log(providerTest ? '✅' : '❌', 'Provider creation with dual env vars');
  
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '💥 Some tests failed!'}`);
  console.log('\n💡 This validates simplified configuration using only USE_LIVE_AI');
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});