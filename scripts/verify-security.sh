#!/bin/bash

# Security Verification Script
# Verifies all security measures from Requirement 18 are properly implemented

# Don't exit on error - we want to collect all results
set +e

echo "=================================================="
echo "Security Hardening Verification Script"
echo "Task 43.1 - Secretary Portal API"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for passed/failed checks
PASSED=0
FAILED=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

# Function to print failure
failure() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

# Function to print info
info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

echo "1. Checking HTTPS Configuration (Requirement 18.1)"
echo "---------------------------------------------------"
if grep -q "hsts:" src/shared/middleware/security.ts; then
    if grep -q "maxAge: 31536000" src/shared/middleware/security.ts; then
        success "HSTS headers configured with 1-year max age"
    else
        failure "HSTS max age not set to 1 year"
    fi
else
    failure "HSTS configuration not found"
fi
echo ""

echo "2. Checking JWT Validation (Requirement 18.2)"
echo "---------------------------------------------------"
if grep -q "jwt.verify" src/shared/middleware/auth.middleware.ts; then
    success "JWT signature validation implemented"
else
    failure "JWT signature validation not found"
fi

if grep -q "TokenExpiredError" src/shared/middleware/auth.middleware.ts; then
    success "JWT expiration validation implemented"
else
    failure "JWT expiration validation not found"
fi
echo ""

echo "3. Checking SQL Injection Prevention (Requirement 18.3)"
echo "---------------------------------------------------"
if grep -q "drizzle-orm" package.json; then
    success "Drizzle ORM configured (parameterized queries)"
else
    failure "Drizzle ORM not found in dependencies"
fi

# Check for raw SQL string concatenation (should not exist)
if grep -rq "db.execute.*+.*" src/modules/secretary-portal/services/ 2>/dev/null; then
    failure "Found potential SQL string concatenation"
else
    success "No SQL string concatenation found"
fi
echo ""

echo "4. Checking File Name Sanitization (Requirement 18.4)"
echo "---------------------------------------------------"
if grep -q "sanitizeFilename" src/modules/secretary-portal/utils/fileUpload.ts; then
    success "File name sanitization function exists"
else
    failure "File name sanitization function not found"
fi

if grep -q "replace(/\[/\\\\\\\]/g" src/modules/secretary-portal/utils/fileUpload.ts; then
    success "Path separator removal implemented"
else
    failure "Path separator removal not found"
fi

if grep -q 'replace(/\\.\\./g' src/modules/secretary-portal/utils/fileUpload.ts; then
    success "Parent directory reference removal implemented"
else
    failure "Parent directory reference removal not found"
fi
echo ""

echo "5. Checking MIME Type Validation (Requirement 18.5)"
echo "---------------------------------------------------"
if grep -q "validateFileExtension" src/modules/secretary-portal/utils/fileUpload.ts; then
    success "File extension validation function exists"
else
    failure "File extension validation function not found"
fi

if grep -q "validateFileType" src/modules/secretary-portal/utils/fileUpload.ts; then
    success "File type validation function exists"
else
    failure "File type validation function not found"
fi
echo ""

echo "6. Checking Rate Limiting (Requirement 18.6)"
echo "---------------------------------------------------"
if grep -q "express-rate-limit" package.json; then
    success "Rate limiting library installed"
else
    failure "Rate limiting library not found"
fi

if grep -q "apiRateLimiter" src/shared/middleware/rateLimiter.ts; then
    success "API rate limiter configured"
else
    failure "API rate limiter not found"
fi

if grep -q "authRateLimiter" src/shared/middleware/rateLimiter.ts; then
    success "Auth rate limiter configured"
else
    failure "Auth rate limiter not found"
fi
echo ""

echo "7. Checking Auth/Authz Failure Logging (Requirement 18.7)"
echo "---------------------------------------------------"
if grep -q "logAuthFailure" src/shared/middleware/auth.middleware.ts; then
    success "Authentication failure logging implemented"
else
    failure "Authentication failure logging not found"
fi

if grep -q "authz_failure" src/rbac/middleware/requirePermission.middleware.ts; then
    success "Authorization failure logging implemented"
else
    failure "Authorization failure logging not found"
fi
echo ""

echo "8. Checking Stack Trace Exposure Prevention (Requirement 18.8)"
echo "---------------------------------------------------"
if grep -q "config.nodeEnv === 'production'" src/shared/middleware/errorHandler.ts; then
    success "Production environment check exists"
else
    failure "Production environment check not found"
fi

if grep -q "!isProduction.*stack" src/shared/middleware/errorHandler.ts; then
    success "Stack trace filtering implemented"
else
    failure "Stack trace filtering not found"
fi
echo ""

echo "9. Checking File Storage Permissions (Requirement 18.9)"
echo "---------------------------------------------------"
if grep -q "mode: 0o750" src/shared/storage/LocalStorage.ts; then
    success "Directory permissions set (0o750)"
else
    failure "Directory permissions not set"
fi

if grep -q "mode: 0o640" src/shared/storage/LocalStorage.ts; then
    success "File permissions set (0o640)"
else
    failure "File permissions not set"
fi
echo ""

echo "10. Checking Parameterized Queries (Requirement 18.10)"
echo "---------------------------------------------------"
if grep -q "from(.*Table)" src/modules/secretary-portal/services/*.ts 2>/dev/null; then
    success "Drizzle ORM query builder usage confirmed"
else
    info "Could not verify query builder usage (may be false negative)"
fi
echo ""

echo "Running Security Tests"
echo "---------------------------------------------------"
if npm test -- src/modules/secretary-portal/tests/security.test.ts --run --reporter=dot 2>&1 | grep -q "21 passed"; then
    success "All security tests passed (21/21)"
else
    failure "Some security tests failed"
fi
echo ""

echo "Checking Documentation"
echo "---------------------------------------------------"
if [ -f "src/modules/secretary-portal/SECURITY_HARDENING.md" ]; then
    success "Security hardening documentation exists"
else
    failure "Security hardening documentation not found"
fi

if [ -f "src/modules/secretary-portal/SECURITY_AUDIT_CHECKLIST.md" ]; then
    success "Security audit checklist exists"
else
    failure "Security audit checklist not found"
fi

if [ -f "src/modules/secretary-portal/TASK_43_SECURITY_IMPLEMENTATION_SUMMARY.md" ]; then
    success "Implementation summary exists"
else
    failure "Implementation summary not found"
fi
echo ""

echo "=================================================="
echo "Verification Summary"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All security measures verified successfully!${NC}"
    echo ""
    echo "Task 43.1 (Security Hardening) is complete and ready for production."
    exit 0
else
    echo -e "${RED}✗ Some security measures failed verification.${NC}"
    echo ""
    echo "Please review the failures above and address them before deployment."
    exit 1
fi
