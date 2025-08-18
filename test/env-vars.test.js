#!/usr/bin/env node

/**
 * Test script to verify dual environment variable support for AI provider selection
 * This test validates the fix for GitHub issue #47
 */

async function testDualEnvVarSupport() {
  console.log('🧪 Testing dual environment variable support...');
  
  try {
    const { validateProviderConfig, createProvider, getProviderInfo } = await import('../packages/core/dist/index.js');
    
    // Test 1: USE_LIVE_AI=true should enable live mode
    console.log('\n📝 Test 1: USE_LIVE_AI=true');
    const config1 = validateProviderConfig({ USE_LIVE_AI: 'true' });
    const info1 = getProviderInfo({ USE_LIVE_AI: 'true' });
    console.log(info1.useLive ? '✅' : '❌', `useLive should be true: ${info1.useLive}`);
    
    // Test 2: VITE_USE_LIVE_AI=true should enable live mode
    console.log('\n📝 Test 2: VITE_USE_LIVE_AI=true');
    const config2 = validateProviderConfig({ VITE_USE_LIVE_AI: 'true' });
    const info2 = getProviderInfo({ VITE_USE_LIVE_AI: 'true' });
    console.log(info2.useLive ? '✅' : '❌', `useLive should be true: ${info2.useLive}`);
    
    // Test 3: Both set should enable live mode
    console.log('\n📝 Test 3: Both USE_LIVE_AI=true and VITE_USE_LIVE_AI=true');
    const config3 = validateProviderConfig({ USE_LIVE_AI: 'true', VITE_USE_LIVE_AI: 'true' });
    const info3 = getProviderInfo({ USE_LIVE_AI: 'true', VITE_USE_LIVE_AI: 'true' });
    console.log(info3.useLive ? '✅' : '❌', `useLive should be true: ${info3.useLive}`);
    
    // Test 4: VITE_USE_LIVE_AI=true overrides USE_LIVE_AI=false
    console.log('\n📝 Test 4: VITE_USE_LIVE_AI=true, USE_LIVE_AI=false');
    const config4 = validateProviderConfig({ USE_LIVE_AI: 'false', VITE_USE_LIVE_AI: 'true' });
    const info4 = getProviderInfo({ USE_LIVE_AI: 'false', VITE_USE_LIVE_AI: 'true' });
    console.log(info4.useLive ? '✅' : '❌', `useLive should be true: ${info4.useLive}`);
    
    // Test 5: Neither set should default to mock
    console.log('\n📝 Test 5: Neither environment variable set');
    const config5 = validateProviderConfig({});
    const info5 = getProviderInfo({});
    console.log(!info5.useLive ? '✅' : '❌', `useLive should be false: ${info5.useLive}`);
    
    // Test 6: Case insensitive (TRUE should work)
    console.log('\n📝 Test 6: Case insensitive - VITE_USE_LIVE_AI=TRUE');
    const config6 = validateProviderConfig({ VITE_USE_LIVE_AI: 'TRUE' });
    const info6 = getProviderInfo({ VITE_USE_LIVE_AI: 'TRUE' });
    console.log(info6.useLive ? '✅' : '❌', `useLive should be true: ${info6.useLive}`);
    
    // Test 7: Live mode with API key should warn about missing key
    console.log('\n📝 Test 7: Live mode warning when API key missing');
    const config7 = validateProviderConfig({ VITE_USE_LIVE_AI: 'true' });
    const hasWarning = config7.warnings.some(w => w.includes('OPENAI_API_KEY'));
    console.log(hasWarning ? '✅' : '❌', `Should warn about missing API key: ${hasWarning}`);
    
    const allPassed = [info1, info2, info3, info4].every(info => info.useLive) && 
                     !info5.useLive && 
                     info6.useLive &&
                     hasWarning;
    
    console.log(`\n📊 Dual Environment Variable Tests: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    return allPassed;
    
  } catch (error) {
    console.log('❌ Failed to test dual environment variable support:', error.message);
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
  
  const envTest = await testDualEnvVarSupport();
  const providerTest = await testProviderCreation();
  
  const allPassed = envTest && providerTest;
  
  console.log('\n📊 Final Results:');
  console.log(envTest ? '✅' : '❌', 'Dual environment variable support');
  console.log(providerTest ? '✅' : '❌', 'Provider creation with dual env vars');
  
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '💥 Some tests failed!'}`);
  console.log('\n💡 This validates the fix for GitHub issue #47 - VITE_USE_LIVE_AI should now work correctly');
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});