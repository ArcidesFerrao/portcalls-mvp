#!/bin/bash

echo "🧪 PortOps Smoke Test"
echo "====================="

API_URL="http://localhost:3001"

# Verificar se o servidor está a correr
echo -n "Checking if server is running... "
if curl -s $API_URL/health > /dev/null 2>&1; then
  echo "✅ Server is running"
else
  echo "❌ Server is not running on $API_URL"
  echo "   Start it with: cd server && npm run dev"
  exit 1
fi

# Testar health check
echo -n "Health check... "
RESPONSE=$(curl -s $API_URL/health)
if echo "$RESPONSE" | grep -q '"status":"ok"'; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# Testar criação de processo
echo -n "Create process... "
RESPONSE=$(curl -s -X POST $API_URL/api/processes \
  -H "Content-Type: application/json" \
  -d '{"vesselName":"SMOKE TEST","client":"Test","port":"Test","coordinator":"Test"}')
PROCESS_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$PROCESS_ID" ]; then
  echo "✅ PASS (ID: $PROCESS_ID)"
else
  echo "❌ FAIL"
  echo "   Response: $RESPONSE"
  exit 1
fi

# Testar listagem
echo -n "List processes... "
COUNT=$(curl -s $API_URL/api/processes | grep -o '"id":' | wc -l)
if [ "$COUNT" -gt 0 ]; then
  echo "✅ PASS ($COUNT processes)"
else
  echo "❌ FAIL"
  exit 1
fi

# Testar obtenção de processo
echo -n "Get process... "
RESPONSE=$(curl -s $API_URL/api/processes/$PROCESS_ID)
if echo "$RESPONSE" | grep -q '"vesselName":"SMOKE TEST"'; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# Testar stats
echo -n "Get stats... "
RESPONSE=$(curl -s $API_URL/api/stats)
if echo "$RESPONSE" | grep -q '"total"'; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# Limpar processo de teste
echo -n "Cleanup... "
curl -s -X DELETE "$API_URL/api/processes/$PROCESS_ID" > /dev/null 2>&1
echo "✅ Done"

echo ""
echo "✅ All smoke tests passed!"
echo ""
echo "Next steps:"
echo "  1. Run full test suite: ./tests/full-test.sh"
echo "  2. Test frontend: npm run dev"
echo "  3. Open browser: http://localhost:5173"
