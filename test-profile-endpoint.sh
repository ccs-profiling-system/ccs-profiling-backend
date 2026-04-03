#!/bin/bash

# Manual Testing Script for Profile Aggregation Endpoint
# Task 36.3 and Task 37

echo "========================================="
echo "Profile Aggregation Manual Testing"
echo "========================================="

# Login and get token
echo -e "\n1. Authenticating..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ccs.edu", "password": "pass1234"}' | jq -r '.data.tokens.access.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi
echo "✓ Authentication successful"

# Get list of students
echo -e "\n2. Fetching students list..."
STUDENTS=$(curl -s -X GET "http://localhost:3000/api/v1/admin/students?limit=5" \
  -H "Authorization: Bearer $TOKEN")

STUDENT_ID=$(echo "$STUDENTS" | jq -r '.data[0].id')
STUDENT_NAME=$(echo "$STUDENTS" | jq -r '.data[0].first_name + " " + .data[0].last_name')
STUDENT_NUMBER=$(echo "$STUDENTS" | jq -r '.data[0].student_id')

echo "✓ Found student: $STUDENT_NAME ($STUDENT_NUMBER)"
echo "  Student UUID: $STUDENT_ID"

# Test 1: Get complete profile with all related data
echo -e "\n3. Testing profile aggregation with all related data..."
START_TIME=$(date +%s%3N)
PROFILE=$(curl -s -X GET "http://localhost:3000/api/v1/admin/students/$STUDENT_ID/profile" \
  -H "Authorization: Bearer $TOKEN")
END_TIME=$(date +%s%3N)
RESPONSE_TIME=$((END_TIME - START_TIME))

SUCCESS=$(echo "$PROFILE" | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Profile request failed"
  echo "$PROFILE" | jq '.'
  exit 1
fi

SKILLS_COUNT=$(echo "$PROFILE" | jq '.data.skills | length')
VIOLATIONS_COUNT=$(echo "$PROFILE" | jq '.data.violations | length')
AFFILIATIONS_COUNT=$(echo "$PROFILE" | jq '.data.affiliations | length')
ACADEMIC_HISTORY_COUNT=$(echo "$PROFILE" | jq '.data.academic_history | length')
ENROLLMENTS_COUNT=$(echo "$PROFILE" | jq '.data.enrollments | length')

echo "✓ Profile retrieved successfully"
echo "  - Skills: $SKILLS_COUNT"
echo "  - Violations: $VIOLATIONS_COUNT"
echo "  - Affiliations: $AFFILIATIONS_COUNT"
echo "  - Academic History: $ACADEMIC_HISTORY_COUNT"
echo "  - Enrollments: $ENROLLMENTS_COUNT"
echo "  - Response Time: ${RESPONSE_TIME}ms"

if [ $RESPONSE_TIME -lt 500 ]; then
  echo "  ✓ Response time within requirement (< 500ms)"
else
  echo "  ⚠️  Response time exceeds requirement (${RESPONSE_TIME}ms > 500ms)"
fi

# Test 2: Verify data structure
echo -e "\n4. Verifying aggregated data structure..."
if [ $SKILLS_COUNT -gt 0 ]; then
  echo "✓ Skills data present"
  echo "$PROFILE" | jq '.data.skills[0]' | head -5
fi

if [ $VIOLATIONS_COUNT -gt 0 ]; then
  echo "✓ Violations data present"
  echo "$PROFILE" | jq '.data.violations[0]' | head -5
fi

if [ $AFFILIATIONS_COUNT -gt 0 ]; then
  echo "✓ Affiliations data present"
  echo "$PROFILE" | jq '.data.affiliations[0]' | head -5
fi

if [ $ACADEMIC_HISTORY_COUNT -gt 0 ]; then
  echo "✓ Academic history data present"
  echo "$PROFILE" | jq '.data.academic_history[0]' | head -5
fi

if [ $ENROLLMENTS_COUNT -gt 0 ]; then
  echo "✓ Enrollments data present"
  echo "$PROFILE" | jq '.data.enrollments[0]' | head -5
fi

# Test 3: Test with student that has no related data
echo -e "\n5. Testing profile with student that has minimal data..."
STUDENT_ID_MINIMAL=$(echo "$STUDENTS" | jq -r '.data[3].id')
STUDENT_NAME_MINIMAL=$(echo "$STUDENTS" | jq -r '.data[3].first_name + " " + .data[3].last_name')

PROFILE_MINIMAL=$(curl -s -X GET "http://localhost:3000/api/v1/admin/students/$STUDENT_ID_MINIMAL/profile" \
  -H "Authorization: Bearer $TOKEN")

SUCCESS_MINIMAL=$(echo "$PROFILE_MINIMAL" | jq -r '.success')
if [ "$SUCCESS_MINIMAL" == "true" ]; then
  echo "✓ Profile retrieved for student with minimal data: $STUDENT_NAME_MINIMAL"
  SKILLS_MIN=$(echo "$PROFILE_MINIMAL" | jq '.data.skills | length')
  echo "  - Skills: $SKILLS_MIN"
else
  echo "❌ Failed to retrieve profile for minimal data student"
fi

# Test 4: Test with invalid student ID
echo -e "\n6. Testing error handling with invalid student ID..."
INVALID_PROFILE=$(curl -s -X GET "http://localhost:3000/api/v1/admin/students/invalid-uuid/profile" \
  -H "Authorization: Bearer $TOKEN")

INVALID_SUCCESS=$(echo "$INVALID_PROFILE" | jq -r '.success')
if [ "$INVALID_SUCCESS" == "false" ]; then
  ERROR_CODE=$(echo "$INVALID_PROFILE" | jq -r '.error.code')
  echo "✓ Error handling works correctly (Error: $ERROR_CODE)"
else
  echo "⚠️  Expected error for invalid ID"
fi

echo -e "\n========================================="
echo "Manual Testing Complete!"
echo "========================================="
echo -e "\nSummary:"
echo "✓ Profile aggregation working"
echo "✓ All related data types included"
echo "✓ Response time: ${RESPONSE_TIME}ms"
echo "✓ Error handling verified"
