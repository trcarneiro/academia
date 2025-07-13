@echo off
echo Testing Production APIs
echo ======================

echo.
echo Testing Health Check...
curl -s http://localhost:3000/health

echo.
echo.
echo Testing Main Subscription Route...
curl -s -X POST http://localhost:3000/api/financial/subscriptions ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\":\"test\",\"planId\":\"test\"}"

echo.
echo.
echo Testing Alternative Subscription Route...
curl -s -X POST http://localhost:3000/api/students/test/subscription ^
  -H "Content-Type: application/json" ^
  -d "{\"planId\":\"test\"}"

echo.
echo.
echo Tests completed.
pause
