#!/usr/bin/env node

/**
 * Simple test script for prompt validation and provider functionality
 * Run with: node test/prompt.test.js
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Test prompt validation
function testPromptValidation() {
  console.log('🧪 Testing prompt validation...');
  
  try {
    const systemPrompt = readFileSync(
      resolve(__dirname, '../packages/protocol/src/prompts/salesCall.system.txt'), 
      'utf-8'
    );
    
    const userPrompt = readFileSync(
      resolve(__dirname, '../packages/protocol/src/prompts/salesCall.user.txt'), 
      'utf-8'
    );
    
    // Test 1: System prompt contains JSON directive
    const hasJsonDirective = systemPrompt.includes('JSON') || systemPrompt.includes('json');
    console.log(hasJsonDirective ? '✅' : '❌', 'System prompt contains JSON directive');
    
    // Test 2: System prompt has version ID
    const hasSystemId = systemPrompt.includes('PROMPT_ID:') && systemPrompt.includes('salesCall.system@');
    console.log(hasSystemId ? '✅' : '❌', 'System prompt has version ID');
    
    // Test 3: User prompt has version ID  
    const hasUserId = userPrompt.includes('PROMPT_ID:') && userPrompt.includes('salesCall.user@');
    console.log(hasUserId ? '✅' : '❌', 'User prompt has version ID');
    
    // Test 4: User prompt contains required fields
    const requiredFields = ['version', 'callId', 'summary', 'sentiment', 'bookingLikelihood'];
    const hasRequiredFields = requiredFields.every(field => userPrompt.includes(field));
    console.log(hasRequiredFields ? '✅' : '❌', 'User prompt contains all required fields');
    
    return hasJsonDirective && hasSystemId && hasUserId && hasRequiredFields;
    
  } catch (error) {
    console.log('❌', 'Failed to read prompt files:', error.message);
    return false;
  }
}

// Test environment configuration
async function testEnvironmentConfig() {
  console.log('\n🧪 Testing environment configuration...');
  
  try {
    const { validateProviderConfig, getProviderInfo } = await import('../packages/core/dist/index.js');
    
    // Test 1: Default configuration
    const defaultConfig = validateProviderConfig({});
    console.log(defaultConfig.valid ? '✅' : '❌', 'Default configuration is valid');
    
    // Test 2: Live mode without API key should warn
    const liveNoKey = validateProviderConfig({ USE_LIVE_AI: 'true' });
    const hasWarning = liveNoKey.warnings.some(w => w.includes('OPENAI_API_KEY'));
    console.log(hasWarning ? '✅' : '❌', 'Live mode without API key produces warning');
    
    // Test 3: Provider info structure
    const info = getProviderInfo({});
    const hasRequiredProps = info.hasOwnProperty('useLive') && 
                             info.hasOwnProperty('hasApiKey') && 
                             info.hasOwnProperty('model');
    console.log(hasRequiredProps ? '✅' : '❌', 'Provider info has required properties');
    
    return defaultConfig.valid && hasWarning && hasRequiredProps;
    
  } catch (error) {
    console.log('❌', 'Failed to test environment config:', error.message);
    return false;
  }
}

// Test utility functions
async function testUtilities() {
  console.log('\n🧪 Testing utility functions...');
  
  try {
    const { truncateTranscript, parsePrompt, redactForLogging } = await import('../packages/core/dist/index.js');
    
    // Test 1: Transcript truncation
    const longText = 'a'.repeat(20000);
    const { content, truncated } = truncateTranscript(longText, 1000);
    const isTruncated = content.length <= 1000 && truncated;
    console.log(isTruncated ? '✅' : '❌', 'Transcript truncation works correctly');
    
    // Test 2: Prompt parsing
    const promptText = 'PROMPT_ID: test@v1.0.0\n\nContent here';
    const parsed = parsePrompt(promptText);
    const isValidParse = parsed.id === 'test' && parsed.version === 'v1.0.0' && parsed.content === 'Content here';
    console.log(isValidParse ? '✅' : '❌', 'Prompt parsing works correctly');
    
    // Test 3: PII redaction
    const sensitiveText = 'Contact john@example.com or call 555-123-4567';
    const redacted = redactForLogging(sensitiveText);
    const isRedacted = redacted.includes('[EMAIL]') && redacted.includes('[PHONE]');
    console.log(isRedacted ? '✅' : '❌', 'PII redaction works correctly');
    
    return isTruncated && isValidParse && isRedacted;
    
  } catch (error) {
    console.log('❌', 'Failed to test utilities:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Running Mudul AI Provider Tests\n');
  
  const promptTest = testPromptValidation();
  const envTest = await testEnvironmentConfig();
  const utilTest = await testUtilities();
  
  const allPassed = promptTest && envTest && utilTest;
  
  console.log('\n📊 Test Results:');
  console.log(promptTest ? '✅' : '❌', 'Prompt validation tests');
  console.log(envTest ? '✅' : '❌', 'Environment configuration tests');
  console.log(utilTest ? '✅' : '❌', 'Utility function tests');
  
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '💥 Some tests failed!'}`);
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});