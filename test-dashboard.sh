#!/bin/bash

# Dashboard Module Test Script
# Tests all dashboard endpoints

BASE_URL="http://localhost:3000/api/v1/admin"

echo "🧪 Testing Dashboard Module Endpoints"
echo "======================================"
echo ""

# First, login to get auth token
echo "1. Logging in to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/../v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ccs.edu",
    "password": "pass1234"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token. Make sure the server is running and admin user exists."
  exit 1
fi

echo "✅ Auth token obtained"
echo ""

# Test 1: Get complete dashboard metrics
echo "2. Testing GET /api/v1/admin/dashboard"
curl -s -X GET "$BASE_URL/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 2: Get student statistics
echo "3. Testing GET /api/v1/admin/dashboard/students"
curl -s -X GET "$BASE_URL/dashboard/students" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 3: Get faculty statistics
echo "4. Testing GET /api/v1/admin/dashboard/faculty"
curl -s -X GET "$BASE_URL/dashboard/faculty" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 4: Get enrollment statistics
echo "5. Testing GET /api/v1/admin/dashboard/enrollments"
curl -s -X GET "$BASE_URL/dashboard/enrollments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 5: Get event statistics
echo "6. Testing GET /api/v1/admin/dashboard/events"
curl -s -X GET "$BASE_URL/dashboard/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "======================================"
echo "✅ Dashboard module tests completed!"
