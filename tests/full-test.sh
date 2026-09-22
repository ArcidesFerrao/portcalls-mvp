#!/bin/bash

echo "🧪 PortOps Full Test Suite"
echo "=========================="

API_URL="http://localhost:3001"
PASS_COUNT=0
FAIL_COUNT=0

# Verificar se o servidor está a correr
echo -n "Checking if server is running... "
if curl -s $API_URL/health > /dev/null 2>&1; then
  echo "✅ Server is running"
else
  echo "❌ Server is not running on $API_URL"
  echo "   Start it with: cd server && npm run dev"
  exit 1
fi

echo ""

# Função de teste
run_test() {
  local test_name=$1
  local command=$2
  local expected=$3
  
  echo -n "$test_name... "
  RESPONSE=$(eval "$command")
  
  if echo "$RESPONSE" | grep -q "$expected"; then
    echo "✅ PASS"
    ((PASS_COUNT++))
  else
    echo "❌ FAIL"
    echo "   Expected: $expected"
    echo "   Got: $(echo $RESPONSE | head -c 200)"
    ((FAIL_COUNT++))
  fi
}

# Testes básicos
echo "=== Basic Tests ==="
run_test "Health check" "curl -s $API_URL/health" '"status":"ok"'

# Criar processo de teste
echo ""
echo "=== Process Tests ==="
RESPONSE=$(curl -s -X POST $API_URL/api/processes \
  -H "Content-Type: application/json" \
  -d '{"vesselName":"TEST VESSEL","imo":"1234567","client":"Test Client","port":"Test Port","terminal":"Test Terminal","coordinator":"Test User","observations":"Test observations"}')
PROCESS_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PROCESS_ID" ]; then
  echo "✅ Created test process (ID: $PROCESS_ID)"
  ((PASS_COUNT++))
else
  echo "❌ Failed to create test process"
  ((FAIL_COUNT++))
  exit 1
fi

run_test "Get process by ID" "curl -s $API_URL/api/processes/$PROCESS_ID" '"vesselName":"TEST VESSEL"'
run_test "Process has authorizations" "curl -s $API_URL/api/processes/$PROCESS_ID" '"authorizations":'
run_test "Process has milestones" "curl -s $API_URL/api/processes/$PROCESS_ID" '"milestones":'
run_test "Process has invoices" "curl -s $API_URL/api/processes/$PROCESS_ID" '"invoices":'
run_test "Process has events" "curl -s $API_URL/api/processes/$PROCESS_ID" '"events":'

# Testar atualização de processo
echo ""
echo "=== Update Tests ==="
run_test "Update process" "curl -s -X PATCH $API_URL/api/processes/$PROCESS_ID -H 'Content-Type: application/json' -d '{\"vesselName\":\"UPDATED VESSEL\"}'" '"vesselName":"UPDATED VESSEL"'

# Obter IDs para testes
AUTH_ID=$(curl -s $API_URL/api/processes/$PROCESS_ID | grep -o '"authorizations":\[[^]]*' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
MS_ID=$(curl -s $API_URL/api/processes/$PROCESS_ID | grep -o '"milestones":\[[^]]*' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
INV_ID=$(curl -s $API_URL/api/processes/$PROCESS_ID | grep -o '"invoices":\[[^]]*' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Testar autorização
echo ""
echo "=== Authorization Tests ==="
if [ -n "$AUTH_ID" ]; then
  run_test "Update authorization" "curl -s -X PATCH $API_URL/api/authorizations/$AUTH_ID -H 'Content-Type: application/json' -d '{\"status\":\"RECEIVED\"}'" '"status":"RECEIVED"'
else
  echo "⚠️  No authorization ID found, skipping"
fi

# Testar marco
echo ""
echo "=== Milestone Tests ==="
if [ -n "$MS_ID" ]; then
  run_test "Confirm milestone" "curl -s -X PATCH $API_URL/api/milestones/$MS_ID -H 'Content-Type: application/json' -d '{\"confirmed\":true}'" '"confirmed":true'
else
  echo "⚠️  No milestone ID found, skipping"
fi

# Testar fatura
echo ""
echo "=== Invoice Tests ==="
if [ -n "$INV_ID" ]; then
  run_test "Update invoice" "curl -s -X PATCH $API_URL/api/invoices/$INV_ID -H 'Content-Type: application/json' -d '{\"status\":\"RECEIVED\",\"reference\":\"INV-TEST-001\",\"amount\":25000}'" '"status":"RECEIVED"'
else
  echo "⚠️  No invoice ID found, skipping"
fi

# Testar ficheiros
echo ""
echo "=== File Tests ==="
FILE_RESPONSE=$(curl -s -X POST $API_URL/api/processes/$PROCESS_ID/files \
  -H "Content-Type: application/json" \
  -d '{"name":"test-document.pdf","originalName":"Test Document.pdf","mimeType":"application/pdf","size":12345,"url":"#local/test.pdf","storageKey":"processes/'$PROCESS_ID'/test.pdf","storageMode":"Local"}')
FILE_ID=$(echo "$FILE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$FILE_ID" ]; then
  echo "✅ Created test file (ID: $FILE_ID)"
  ((PASS_COUNT++))
  
  run_test "File appears in process" "curl -s $API_URL/api/processes/$PROCESS_ID" '"originalName":"Test Document.pdf"'
  
  # Testar remoção de ficheiro
  echo -n "Delete file... "
  DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/api/files/$FILE_ID)
  if [ "$DELETE_STATUS" = "204" ]; then
    echo "✅ PASS"
    ((PASS_COUNT++))
  else
    echo "❌ FAIL (Status: $DELETE_STATUS)"
    ((FAIL_COUNT++))
  fi
else
  echo "❌ Failed to create test file"
  ((FAIL_COUNT++))
fi

# Testar estatísticas
echo ""
echo "=== Stats Tests ==="
run_test "Get stats" "curl -s $API_URL/api/stats" '"total"'
run_test "Stats has open count" "curl -s $API_URL/api/stats" '"open"'
run_test "Stats has closed count" "curl -s $API_URL/api/stats" '"closed"'

# Testar encerramento
echo ""
echo "=== Close Process Tests ==="
run_test "Close process" "curl -s -X POST $API_URL/api/processes/$PROCESS_ID/close" '"status":"CLOSED"'
run_test "Process has closedAt" "curl -s $API_URL/api/processes/$PROCESS_ID" '"closedAt"'
run_test "Progress is 100" "curl -s $API_URL/api/processes/$PROCESS_ID" '"progress":100'

# Limpar
echo ""
echo "=== Cleanup ==="
echo -n "Delete test process... "
DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/api/processes/$PROCESS_ID")
if [ "$DELETE_STATUS" = "204" ]; then
  echo "✅ Done"
else
  echo "⚠️  Status: $DELETE_STATUS (process may not have delete endpoint)"
fi

# Resumo
echo ""
echo "=========================="
echo "Test Results:"
echo "=========================="
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo "=========================="

if [ $FAIL_COUNT -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed"
  exit 1
fi
