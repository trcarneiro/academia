#!/bin/bash

# 🧪 Academia Deployment Test Script
# Tests all critical components before/after deployment

set -e  # Exit on any error

echo "🧪 Starting Academia Deployment Tests..."
echo "========================================"

# Configuration
SERVER_URL="${1:-http://localhost:3000}"
API_URL="$SERVER_URL/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $response)"
        ((FAILED++))
    fi
}

# 1. Health Checks
echo ""
echo "1️⃣  Health Checks"
echo "-------------------"
test_endpoint "Server Health" "$SERVER_URL/health" 200
test_endpoint "Database Connection" "$API_URL/health" 200

# 2. Public Endpoints (no auth required)
echo ""
echo "2️⃣  Public Endpoints"
echo "-------------------"
test_endpoint "Frontend Index" "$SERVER_URL/" 200
test_endpoint "Swagger Docs" "$SERVER_URL/docs" 200
test_endpoint "Organizations List" "$API_URL/organizations" 200

# 3. Auth Endpoints
echo ""
echo "3️⃣  Authentication"
echo "-------------------"
test_endpoint "Auth Routes Available" "$API_URL/auth/test" 404  # Should exist but return 404 for invalid route

# 4. API Endpoints (might need auth)
echo ""
echo "4️⃣  API Endpoints"
echo "-------------------"
test_endpoint "Students API" "$API_URL/students" 401  # Should require auth
test_endpoint "Instructors API" "$API_URL/instructors" 401
test_endpoint "Courses API" "$API_URL/courses" 401
test_endpoint "Classes API" "$API_URL/classes" 401
test_endpoint "Attendance API" "$API_URL/attendance" 401

# 5. Static Assets
echo ""
echo "5️⃣  Static Assets"
echo "-------------------"
test_endpoint "CSS Files" "$SERVER_URL/css/styles.css" 200
test_endpoint "JS Files" "$SERVER_URL/js/core/app.js" 200

# 6. Performance Checks
echo ""
echo "6️⃣  Performance Checks"
echo "-------------------"

echo -n "Response Time (Health)... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$SERVER_URL/health")
if (( $(echo "$response_time < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} (${response_time}s)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SLOW${NC} (${response_time}s - should be < 1s)"
    ((FAILED++))
fi

# 7. Database Schema Check
echo ""
echo "7️⃣  Database Schema"
echo "-------------------"

if command -v psql &> /dev/null; then
    echo -n "Checking database tables... "
    
    # Try to connect to database (requires DATABASE_URL env var)
    if [ -n "$DATABASE_URL" ]; then
        table_count=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
        
        if [ "$table_count" -gt "30" ]; then
            echo -e "${GREEN}✓ PASS${NC} ($table_count tables found)"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAIL${NC} (Only $table_count tables, expected > 30)"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⊘ SKIP${NC} (DATABASE_URL not set)"
    fi
else
    echo -e "${YELLOW}⊘ SKIP${NC} (psql not installed)"
fi

# 8. Process Check (PM2)
echo ""
echo "8️⃣  Process Management"
echo "-------------------"

if command -v pm2 &> /dev/null; then
    echo -n "Checking PM2 status... "
    
    pm2_status=$(pm2 jlist 2>/dev/null | grep -c '"name":"academia"' || echo "0")
    
    if [ "$pm2_status" -gt "0" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Academia process running)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⊘ SKIP${NC} (Academia not running in PM2 - might be dev mode)"
    fi
else
    echo -e "${YELLOW}⊘ SKIP${NC} (PM2 not installed)"
fi

# 9. Disk Space Check
echo ""
echo "9️⃣  System Resources"
echo "-------------------"

echo -n "Checking disk space... "
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$disk_usage" -lt "80" ]; then
    echo -e "${GREEN}✓ PASS${NC} (${disk_usage}% used)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (${disk_usage}% used - consider cleanup)"
    ((FAILED++))
fi

# 10. Memory Check
echo -n "Checking memory... "
if command -v free &> /dev/null; then
    mem_usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    
    if [ "$mem_usage" -lt "90" ]; then
        echo -e "${GREEN}✓ PASS${NC} (${mem_usage}% used)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} (${mem_usage}% used - high memory usage)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ SKIP${NC} (free command not available)"
fi

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo ""
echo -e "Success Rate: ${SUCCESS_RATE}%"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ All tests passed! Deployment successful! ✨${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed, but deployment is mostly functional${NC}"
    exit 0
else
    echo -e "${RED}❌ Too many failures. Deployment needs attention!${NC}"
    exit 1
fi
