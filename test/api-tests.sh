#!/bin/bash

# Enhanced curl test suite for API analyze endpoint
# Tests various scenarios including fallback and error conditions

set -e

BASE_URL="${BASE_URL:-http://localhost:5173}"
API_URL="$BASE_URL/api/analyze"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Enhanced API Test Suite${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo ""

# Test helper function
test_request() {
    local test_name="$1"
    local data="$2"
    local expected_status="$3"
    local expect_header="$4"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    # Capture both response and headers
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "Content-Type: application/json" \
        -X POST \
        -d "$data" \
        "$API_URL")
    
    # Extract HTTP status and body
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    echo "Status: $http_status"
    echo "Response: $(echo "$body" | jq -c . 2>/dev/null || echo "$body")"
    
    # Check status code
    if [ "$http_status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Status code correct${NC}"
    else
        echo -e "${RED}❌ Expected status $expected_status, got $http_status${NC}"
        return 1
    fi
    
    # Check for expected header (if provided)
    if [ -n "$expect_header" ]; then
        headers=$(curl -s -I -H "Content-Type: application/json" -X POST -d "$data" "$API_URL")
        if echo "$headers" | grep -q "$expect_header"; then
            echo -e "${GREEN}✅ Expected header found: $expect_header${NC}"
        else
            echo -e "${RED}❌ Expected header not found: $expect_header${NC}"
            return 1
        fi
    fi
    
    echo ""
}

# Test 1: Default mock behavior (USE_LIVE_AI=false)
echo -e "${BLUE}=== Test 1: Default Mock Behavior ===${NC}"
test_request "Valid request with mock provider" \
    '{"sessionId":"test-1","transcript":"Hello, this is a test sales call."}' \
    "200"

# Test 2: Invalid JSON
echo -e "${BLUE}=== Test 2: Invalid Requests ===${NC}"
test_request "Invalid JSON" \
    '{"sessionId":"test-2","transcript":"}' \
    "400"

# Test 3: Missing required fields
test_request "Missing sessionId" \
    '{"transcript":"Hello world"}' \
    "400"

test_request "Missing transcript" \
    '{"sessionId":"test-3"}' \
    "400"

test_request "Empty transcript" \
    '{"sessionId":"test-4","transcript":""}' \
    "400"

# Test 4: Large payload
echo -e "${BLUE}=== Test 4: Payload Size Limits ===${NC}"
large_transcript=$(printf 'A%.0s' {1..1048577}) # > 1MB
test_request "Transcript too large" \
    "{\"sessionId\":\"test-5\",\"transcript\":\"$large_transcript\"}" \
    "413"

# Test 5: Live mode without API key (should fallback)
echo -e "${BLUE}=== Test 5: Live Mode Fallback ===${NC}"
echo "Setting USE_LIVE_AI=true without API key..."

USE_LIVE_AI=true test_request "Live mode without API key (should fallback)" \
    '{"sessionId":"test-6","transcript":"This should trigger fallback to mock"}' \
    "200" \
    "x-ai-fallback: 1"

# Test 6: Live mode with invalid API key (if OPENAI_API_KEY is set but invalid)
if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "" ]; then
    echo -e "${BLUE}=== Test 6: Live Mode with Invalid Key ===${NC}"
    
    USE_LIVE_AI=true OPENAI_API_KEY="invalid-key-12345" test_request "Live mode with invalid API key" \
        '{"sessionId":"test-7","transcript":"This should fail and fallback to mock"}' \
        "200" \
        "x-ai-fallback: 1"
fi

# Test 7: Fallback disabled (ALLOW_FALLBACK=false)
echo -e "${BLUE}=== Test 7: Fallback Disabled ===${NC}"
USE_LIVE_AI=true ALLOW_FALLBACK=false test_request "Live mode with fallback disabled" \
    '{"sessionId":"test-8","transcript":"This should return 502 when fallback is disabled"}' \
    "502"

# Test 8: Valid responses contain expected structure
echo -e "${BLUE}=== Test 8: Response Structure Validation ===${NC}"
response=$(curl -s -H "Content-Type: application/json" \
    -X POST \
    -d '{"sessionId":"test-9","transcript":"Test sales call about our new product."}' \
    "$API_URL")

echo "Response structure test:"
echo "$response" | jq -c .

# Check for required fields in successful response
if echo "$response" | jq -e '.data and .source and .meta' > /dev/null; then
    echo -e "${GREEN}✅ Response has required structure (data, source, meta)${NC}"
else
    echo -e "${RED}❌ Response missing required fields${NC}"
fi

if echo "$response" | jq -e '.meta.provider and .meta.duration_ms and .meta.request_id' > /dev/null; then
    echo -e "${GREEN}✅ Meta object has required fields${NC}"
else
    echo -e "${RED}❌ Meta object missing required fields${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Test suite completed!${NC}"
echo ""
echo -e "${YELLOW}Note: To test live OpenAI integration:${NC}"
echo -e "1. Set OPENAI_API_KEY environment variable"
echo -e "2. Set USE_LIVE_AI=true"
echo -e "3. Rerun this script"
echo ""
echo -e "${YELLOW}Example:${NC}"
echo -e "OPENAI_API_KEY=your-key-here USE_LIVE_AI=true $0"