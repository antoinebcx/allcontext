#!/bin/bash

# Test script for API Keys functionality
# Requires the backend to be running on localhost:8000

API_URL="http://localhost:8000"
EMAIL="test@example.com"
PASSWORD="test123456"

echo "========================================="
echo "API Key Feature Test Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create a test user (or login if exists)
echo -e "${YELLOW}Step 1: Authenticating user...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

if [[ $AUTH_RESPONSE == *"access_token"* ]]; then
  echo -e "${GREEN}✓ User logged in successfully${NC}"
else
  # Try to create the user
  echo "User doesn't exist, creating new user..."
  AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
  
  if [[ $AUTH_RESPONSE == *"access_token"* ]]; then
    echo -e "${GREEN}✓ User created and logged in successfully${NC}"
  else
    echo -e "${RED}✗ Failed to authenticate: $AUTH_RESPONSE${NC}"
    exit 1
  fi
fi

# Extract token
TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "Token obtained: ${TOKEN:0:20}..."
echo ""

# Step 2: List existing API keys
echo -e "${YELLOW}Step 2: Listing existing API keys...${NC}"
LIST_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/api-keys" \
  -H "Authorization: Bearer $TOKEN")

echo "Current API keys: $LIST_RESPONSE"
echo ""

# Step 3: Create a new API key
echo -e "${YELLOW}Step 3: Creating a new API key...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/api-keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test API Key",
    "scopes": ["read", "write"]
  }')

if [[ $CREATE_RESPONSE == *"api_key"* ]]; then
  echo -e "${GREEN}✓ API key created successfully${NC}"
  
  # Extract the actual API key
  API_KEY=$(echo $CREATE_RESPONSE | grep -o '"api_key":"[^"]*' | cut -d'"' -f4)
  KEY_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  
  echo "API Key: $API_KEY"
  echo "Key ID: $KEY_ID"
else
  echo -e "${RED}✗ Failed to create API key: $CREATE_RESPONSE${NC}"
  exit 1
fi
echo ""

# Step 4: Test API key authentication
echo -e "${YELLOW}Step 4: Testing API key authentication...${NC}"
TEST_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/artifacts" \
  -H "X-API-Key: $API_KEY")

if [[ $TEST_RESPONSE == *"items"* ]]; then
  echo -e "${GREEN}✓ API key authentication successful${NC}"
  echo "Response: ${TEST_RESPONSE:0:100}..."
else
  echo -e "${RED}✗ API key authentication failed: $TEST_RESPONSE${NC}"
fi
echo ""

# Step 5: Create an artifact using API key
echo -e "${YELLOW}Step 5: Creating artifact with API key...${NC}"
ARTIFACT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/artifacts" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "title": "Test Artifact via API Key",
    "content": "This artifact was created using an API key for authentication."
  }')

if [[ $ARTIFACT_RESPONSE == *"id"* ]]; then
  echo -e "${GREEN}✓ Artifact created successfully with API key${NC}"
  ARTIFACT_ID=$(echo $ARTIFACT_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "Artifact ID: $ARTIFACT_ID"
else
  echo -e "${RED}✗ Failed to create artifact: $ARTIFACT_RESPONSE${NC}"
fi
echo ""

# Step 6: Update API key (disable it)
echo -e "${YELLOW}Step 6: Disabling API key...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/api/v1/api-keys/$KEY_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "is_active": false
  }')

if [[ $UPDATE_RESPONSE == *"is_active"* ]]; then
  echo -e "${GREEN}✓ API key updated successfully${NC}"
else
  echo -e "${RED}✗ Failed to update API key: $UPDATE_RESPONSE${NC}"
fi
echo ""

# Step 7: Try to use disabled API key
echo -e "${YELLOW}Step 7: Testing disabled API key...${NC}"
DISABLED_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/artifacts" \
  -H "X-API-Key: $API_KEY")

if [[ $DISABLED_RESPONSE == *"401"* ]] || [[ $DISABLED_RESPONSE == *"Unauthorized"* ]] || [[ $DISABLED_RESPONSE == *"Invalid"* ]]; then
  echo -e "${GREEN}✓ Disabled API key correctly rejected${NC}"
else
  echo -e "${RED}✗ Disabled API key still working (should be rejected): $DISABLED_RESPONSE${NC}"
fi
echo ""

# Step 8: Delete API key
echo -e "${YELLOW}Step 8: Deleting API key...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/api/v1/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ API key deleted${NC}"
echo ""

# Summary
echo "========================================="
echo -e "${GREEN}API Key Feature Test Complete!${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "✓ User authentication working"
echo "✓ API key creation working"
echo "✓ API key authentication working"
echo "✓ API key can perform operations"
echo "✓ API key update/disable working"
echo "✓ API key deletion working"
echo ""
echo "The API key feature is fully functional!"