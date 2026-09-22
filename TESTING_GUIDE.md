# 🧪 Guia de Testes — PortOps MVP

Guia completo para testar o sistema sem necessidade de conta SharePoint.

---

## 📋 Índice

1. [Teste Rápido (5 minutos)](#teste-rápido-5-minutos)
2. [Teste do Frontend (Modo Local)](#teste-do-frontend-modo-local)
3. [Teste do Backend API](#teste-do-backend-api)
4. [Teste da Base de Dados](#teste-da-base-de-dados)
5. [Teste de Fluxos Completos](#teste-de-fluxos-completos)
6. [Scripts de Teste Automatizados](#scripts-de-teste-automatizados)
7. [Dados de Teste](#dados-de-teste)
8. [Checklist de Validação](#checklist-de-validação)

---

## 🚀 Teste Rápido (5 minutos)

### Objetivo
Verificar se o sistema funciona em modo local (sem SharePoint, sem backend).

### Passos

1. **Iniciar frontend:**
```bash
npm run dev
```

2. **Aceder a:** `http://localhost:5173`

3. **Verificar:**
   - [ ] Dashboard carrega com dados demo
   - [ ] 7 métricas visíveis
   - [ ] Tabela de processos aparece
   - [ ] Pesquisa funciona
   - [ ] Filtro por estado funciona

4. **Criar operação:**
   - [ ] Clicar em "Nova Operação"
   - [ ] Preencher formulário
   - [ ] Submeter
   - [ ] Redireciona para detalhes

5. **Testar detalhes:**
   - [ ] 6 separadores visíveis
   - [ ] Dados gerais corretos
   - [ ] Autorizações (5 entidades)
   - [ ] Marcos (10 etapas)
   - [ ] Faturas (6 entidades)
   - [ ] Documentos (upload local)
   - [ ] Histórico (timeline)

**Resultado esperado:** ✅ Sistema funcional em modo local

---

## 🎨 Teste do Frontend (Modo Local)

### Pré-requisitos
- Node.js instalado
- Navegador moderno

### Passos Detalhados

#### 1. Instalação
```bash
npm install
npm run dev
```

#### 2. Configuração Inicial
- Aceder a `http://localhost:5173/setup`
- Selecionar **"Local"** como modo de armazenamento
- Clicar em **"Continuar"**

#### 3. Testar Dashboard

**Teste 3.1: Visualização**
- [ ] 7 cards de métricas visíveis
- [ ] Valores corretos (5 operações demo)
- [ ] Ícones corretos

**Teste 3.2: Pesquisa**
```
Pesquisar: "MSC"
Resultado esperado: 1 operação (MSC AURORA)

Pesquisar: "Sines"
Resultado esperado: 3 operações (portos de Sines)

Pesquisar: "Carlos"
Resultado esperado: 2 operações (coordenador Carlos Mendes)
```

**Teste 3.3: Filtros**
```
Filtro: "Abertos"
Resultado esperado: 4 operações

Filtro: "Fechados"
Resultado esperado: 1 operação (EVER GIVEN)
```

**Teste 3.4: Ordenação**
- [ ] Processos ordenados por data (mais recente primeiro)
- [ ] Barra de progresso visível
- [ ] Badges de estado corretos

#### 4. Testar Nova Operação

**Teste 4.1: Validação de Campos**
```
Submeter formulário vazio
Resultado esperado: Erros em campos obrigatórios
- Nome do navio: "Nome do navio é obrigatório"
- Cliente: "Cliente é obrigatório"
- Porto: "Porto é obrigatório"
- Coordenador: "Coordenador é obrigatório"
```

**Teste 4.2: Criação Válida**
```
Preencher:
- Navio: "TEST VESSEL"
- IMO: "1234567"
- Cliente: "Test Client"
- Porto: "Porto de Teste"
- Terminal: "Terminal Test"
- Coordenador: "Test User"
- Observações: "Operação de teste"

Submeter
Resultado esperado:
- Redireciona para /processes/:id
- Processo criado com sucesso
- Autorizações padrão criadas (5)
- Marcos padrão criados (10)
- Faturas padrão criadas (6)
```

#### 5. Testar Detalhes da Operação

**Teste 5.1: Separador Geral**
- [ ] Todos os campos visíveis
- [ ] Datas formatadas corretamente
- [ ] Botão "Editar" funcional
- [ ] Edição inline funciona
- [ ] Botão "Guardar" atualiza dados

**Teste 5.2: Separador Autorizações**
```
Clicar "Recebido" em "Saúde Portuária"
Resultado esperado:
- Badge muda para verde
- Data de receção registada
- Evento adicionado ao histórico
- Progresso atualizado
```

**Teste 5.3: Separador Marcos**
```
Confirmar "Chegada do Navio (ATA)"
Resultado esperado:
- Toggle ativado
- Data auto-preenchida
- Campo ATA atualizado no separador Geral
- Evento adicionado ao histórico
```

**Teste 5.4: Separador Faturas**
```
Clicar "Marcar Recebida" em "PBT"
Preencher: Ref: "INV-001", Valor: "50000"
Clicar "Confirmar"
Resultado esperado:
- Fatura move para secção "Recebidas"
- Referência e valor visíveis
- Evento adicionado ao histórico
```

**Teste 5.5: Separador Documentos**
```
Clicar "Adicionar"
Selecionar ficheiro PDF
Resultado esperado:
- Ficheiro aparece na lista
- Metadados visíveis (nome, tamanho, data)
- Badge "Local" visível (modo local)
- Ícone "Ver" funcional
- Ícone "Remover" funcional
```

**Teste 5.6: Separador Histórico**
- [ ] Eventos ordenados (mais recente primeiro)
- [ ] Timestamps corretos
- [ ] Utilizadores visíveis
- [ ] Descrições claras

#### 6. Testar Encerramento

```
Clicar "Encerrar"
Confirmar no modal
Resultado esperado:
- Status muda para "Fechado"
- Data de encerramento registada
- Botões "Editar" e "Encerrar" desaparecem
- Upload de ficheiros desativado
- Toggles de marcos desativados
- Progresso = 100%
```

---

## 🔌 Teste do Backend API

### Pré-requisitos
- PostgreSQL instalado e a correr
- Node.js instalado

### Instalação do Backend

```bash
cd server
npm install
cp .env.example .env
```

### Configuração da Base de Dados

Editar `server/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/portops_test"
PORT=3001
```

Criar base de dados:
```bash
psql -U postgres
CREATE DATABASE portops_test;
\q
```

Executar migrações:
```bash
npm run db:generate
npm run db:push
```

### Iniciar Servidor

```bash
npm run dev
```

Servidor disponível em: `http://localhost:3001`

### Testes da API

#### Teste 1: Health Check
```bash
curl http://localhost:3001/health
```
**Resultado esperado:**
```json
{"status":"ok","timestamp":"2026-09-09T..."}
```

#### Teste 2: Criar Processo
```bash
curl -X POST http://localhost:3001/api/processes \
  -H "Content-Type: application/json" \
  -d '{
    "vesselName": "API TEST VESSEL",
    "imo": "9999999",
    "client": "API Test Client",
    "port": "Porto de Teste",
    "terminal": "Terminal API",
    "coordinator": "API Tester",
    "observations": "Teste via API"
  }'
```
**Resultado esperado:**
- Status 201
- JSON com processo completo
- ID gerado
- Autorizações, marcos, faturas criados

#### Teste 3: Listar Processos
```bash
curl http://localhost:3001/api/processes
```
**Resultado esperado:**
- Array de processos
- Inclui o processo criado no Teste 2

#### Teste 4: Obter Processo por ID
```bash
curl http://localhost:3001/api/processes/{ID_DO_PROCESSO}
```
**Resultado esperado:**
- JSON com processo completo
- Inclui authorizations, milestones, invoices, files, events

#### Teste 5: Atualizar Processo
```bash
curl -X PATCH http://localhost:3001/api/processes/{ID} \
  -H "Content-Type: application/json" \
  -d '{
    "vesselName": "UPDATED VESSEL NAME"
  }'
```
**Resultado esperado:**
- Status 200
- vesselName atualizado

#### Teste 6: Atualizar Autorização
```bash
# Primeiro, obter ID de uma autorização
curl http://localhost:3001/api/processes/{ID} | jq '.authorizations[0].id'

# Depois, atualizar
curl -X PATCH http://localhost:3001/api/authorizations/{AUTH_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "RECEIVED"}'
```
**Resultado esperado:**
- Status 200
- status = "RECEIVED"
- receivedAt preenchido

#### Teste 7: Confirmar Marco
```bash
# Obter ID de um marco
curl http://localhost:3001/api/processes/{ID} | jq '.milestones[0].id'

# Confirmar
curl -X PATCH http://localhost:3001/api/milestones/{MS_ID} \
  -H "Content-Type: application/json" \
  -d '{"confirmed": true}'
```
**Resultado esperado:**
- Status 200
- confirmed = true
- date preenchido

#### Teste 8: Atualizar Fatura
```bash
# Obter ID de uma fatura
curl http://localhost:3001/api/processes/{ID} | jq '.invoices[0].id'

# Atualizar
curl -X PATCH http://localhost:3001/api/invoices/{INV_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RECEIVED",
    "reference": "INV-TEST-001",
    "amount": 25000
  }'
```
**Resultado esperado:**
- Status 200
- status = "RECEIVED"
- reference e amount preenchidos

#### Teste 9: Adicionar Ficheiro
```bash
curl -X POST http://localhost:3001/api/processes/{ID}/files \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-document.pdf",
    "originalName": "Test Document.pdf",
    "mimeType": "application/pdf",
    "size": 12345,
    "url": "#local/test-document.pdf",
    "storageKey": "processes/{ID}/test-document.pdf",
    "storageMode": "Local"
  }'
```
**Resultado esperado:**
- Status 201
- Ficheiro criado com ID

#### Teste 10: Estatísticas
```bash
curl http://localhost:3001/api/stats
```
**Resultado esperado:**
```json
{
  "total": 1,
  "open": 1,
  "closed": 0,
  "awaitingArrival": 1,
  "awaitingDeparture": 0,
  "invoicesReceived": 1,
  "invoicesAwaiting": 5,
  "critical": 0
}
```

#### Teste 11: Encerrar Processo
```bash
curl -X POST http://localhost:3001/api/processes/{ID}/close
```
**Resultado esperado:**
- Status 200
- status = "CLOSED"
- closedAt preenchido
- progress = 100

#### Teste 12: Remover Ficheiro
```bash
curl -X DELETE http://localhost:3001/api/files/{FILE_ID}
```
**Resultado esperado:**
- Status 204 (No Content)

---

## 🗄️ Teste da Base de Dados

### Verificar Tabelas

```bash
psql -U postgres -d portops_test
```

```sql
-- Listar tabelas
\dt

-- Resultado esperado:
-- processes
-- authorizations
-- milestones
-- invoices
-- files
-- timeline_events
```

### Verificar Dados

```sql
-- Contar processos
SELECT COUNT(*) FROM processes;

-- Ver processos
SELECT id, fileNumber, vesselName, status FROM processes;

-- Ver autorizações de um processo
SELECT * FROM authorizations WHERE processId = '{ID}';

-- Ver marcos de um processo
SELECT * FROM milestones WHERE processId = '{ID}' ORDER BY "order";

-- Ver faturas de um processo
SELECT * FROM invoices WHERE processId = '{ID}';

-- Ver ficheiros de um processo
SELECT * FROM files WHERE processId = '{ID}';

-- Ver eventos de um processo
SELECT * FROM timeline_events WHERE processId = '{ID}' ORDER BY timestamp DESC;
```

### Testar Relacionamentos

```sql
-- Ver processo com todas as relações
SELECT 
  p.fileNumber,
  p.vesselName,
  COUNT(DISTINCT a.id) as auth_count,
  COUNT(DISTINCT m.id) as milestone_count,
  COUNT(DISTINCT i.id) as invoice_count,
  COUNT(DISTINCT f.id) as file_count,
  COUNT(DISTINCT e.id) as event_count
FROM processes p
LEFT JOIN authorizations a ON p.id = a.processId
LEFT JOIN milestones m ON p.id = m.processId
LEFT JOIN invoices i ON p.id = i.processId
LEFT JOIN files f ON p.id = f.processId
LEFT JOIN timeline_events e ON p.id = e.processId
GROUP BY p.id, p.fileNumber, p.vesselName;
```

### Testar Cascade Delete

```sql
-- Criar processo de teste
INSERT INTO processes (id, fileNumber, srfNumber, vesselName, client, port, coordinator, status, progress)
VALUES ('test-delete', '999999', 'SRF-TEST', 'DELETE TEST', 'Test', 'Test', 'Test', 'OPEN', 0);

-- Verificar que existe
SELECT * FROM processes WHERE id = 'test-delete';

-- Eliminar processo
DELETE FROM processes WHERE id = 'test-delete';

-- Verificar que foi eliminado
SELECT * FROM processes WHERE id = 'test-delete';
-- Resultado: 0 rows
```

---

## 🔄 Teste de Fluxos Completos

### Fluxo 1: Operação Completa (Sem SharePoint)

**Objetivo:** Testar ciclo de vida completo de uma operação

**Passos:**

1. **Criar operação**
```bash
# Via frontend ou API
POST /api/processes
{
  "vesselName": "FLOW TEST VESSEL",
  "client": "Flow Test Client",
  "port": "Porto de Teste",
  "coordinator": "Flow Tester"
}
```

2. **Notificar autoridades**
```bash
# Marcar 3 autorizações como recebidas
PATCH /api/authorizations/{id1} { "status": "RECEIVED" }
PATCH /api/authorizations/{id2} { "status": "RECEIVED" }
PATCH /api/authorizations/{id3} { "status": "NOT_APPLICABLE" }
```

3. **Confirmar marcos**
```bash
# Confirmar primeiros 7 marcos
PATCH /api/milestones/{id1} { "confirmed": true }
PATCH /api/milestones/{id2} { "confirmed": true }
...
PATCH /api/milestones/{id7} { "confirmed": true }
```

4. **Receber faturas**
```bash
# Marcar 4 faturas como recebidas
PATCH /api/invoices/{id1} { "status": "RECEIVED", "reference": "INV-001", "amount": 10000 }
PATCH /api/invoices/{id2} { "status": "RECEIVED", "reference": "INV-002", "amount": 15000 }
PATCH /api/invoices/{id3} { "status": "RECEIVED", "reference": "INV-003", "amount": 20000 }
PATCH /api/invoices/{id4} { "status": "RECEIVED", "reference": "INV-004", "amount": 25000 }
```

5. **Adicionar documentos**
```bash
# Adicionar 3 ficheiros
POST /api/processes/{id}/files
{ "name": "doc1.pdf", "originalName": "Doc 1.pdf", "mimeType": "application/pdf", "size": 1000, ... }
POST /api/processes/{id}/files
{ "name": "doc2.pdf", "originalName": "Doc 2.pdf", "mimeType": "application/pdf", "size": 2000, ... }
POST /api/processes/{id}/files
{ "name": "doc3.pdf", "originalName": "Doc 3.pdf", "mimeType": "application/pdf", "size": 3000, ... }
```

6. **Verificar progresso**
```bash
GET /api/processes/{id}
# Verificar campo "progress"
# Esperado: ~70-80%
```

7. **Encerrar operação**
```bash
POST /api/processes/{id}/close
```

8. **Verificar estado final**
```bash
GET /api/processes/{id}
# Esperado:
# - status: "CLOSED"
# - progress: 100
# - closedAt: preenchido
```

### Fluxo 2: Pesquisa e Filtros

**Objetivo:** Testar funcionalidades de pesquisa

**Passos:**

1. **Criar 5 operações de teste**
```bash
# Criar operações com dados variados
POST /api/processes { "vesselName": "SEARCH TEST 1", "client": "Client A", "port": "Porto A", ... }
POST /api/processes { "vesselName": "SEARCH TEST 2", "client": "Client B", "port": "Porto B", ... }
POST /api/processes { "vesselName": "SEARCH TEST 3", "client": "Client A", "port": "Porto A", ... }
POST /api/processes { "vesselName": "OTHER VESSEL", "client": "Client C", "port": "Porto C", ... }
POST /api/processes { "vesselName": "ANOTHER SHIP", "client": "Client A", "port": "Porto D", ... }
```

2. **Testar pesquisa por navio**
```bash
GET /api/processes?search=SEARCH
# Esperado: 3 resultados
```

3. **Testar pesquisa por cliente**
```bash
GET /api/processes?search=Client A
# Esperado: 3 resultados
```

4. **Testar filtro por estado**
```bash
# Encerrar 2 operações
POST /api/processes/{id1}/close
POST /api/processes/{id2}/close

# Filtrar abertos
GET /api/processes?status=OPEN
# Esperado: 3 resultados

# Filtrar fechados
GET /api/processes?status=CLOSED
# Esperado: 2 resultados
```

### Fluxo 3: Simulação de Upload (Sem SharePoint)

**Objetivo:** Testar upload de ficheiros em modo local

**Passos:**

1. **Criar operação**
```bash
POST /api/processes { "vesselName": "UPLOAD TEST", ... }
```

2. **Simular upload de ficheiro**
```bash
# Criar ficheiro de teste
echo "Test content" > test.txt

# Adicionar referência (sem upload real)
POST /api/processes/{id}/files
{
  "name": "test.txt",
  "originalName": "Test File.txt",
  "mimeType": "text/plain",
  "size": 13,
  "url": "#local/test.txt",
  "storageKey": "processes/{id}/test.txt",
  "storageMode": "Local"
}
```

3. **Verificar ficheiro**
```bash
GET /api/processes/{id}
# Verificar array "files"
# Esperado: 1 ficheiro com storageMode = "Local"
```

4. **Remover ficheiro**
```bash
DELETE /api/files/{fileId}
```

---

## 🤖 Scripts de Teste Automatizados

### Script 1: Teste de Smoke (Básico)

Criar `tests/smoke-test.sh`:

```bash
#!/bin/bash

echo "🧪 PortOps Smoke Test"
echo "====================="

# Testar health check
echo -n "Health check... "
RESPONSE=$(curl -s http://localhost:3001/health)
if echo "$RESPONSE" | grep -q '"status":"ok"'; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# Testar criação de processo
echo -n "Create process... "
RESPONSE=$(curl -s -X POST http://localhost:3001/api/processes \
  -H "Content-Type: application/json" \
  -d '{"vesselName":"SMOKE TEST","client":"Test","port":"Test","coordinator":"Test"}')
PROCESS_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$PROCESS_ID" ]; then
  echo "✅ PASS (ID: $PROCESS_ID)"
else
  echo "❌ FAIL"
  exit 1
fi

# Testar listagem
echo -n "List processes... "
COUNT=$(curl -s http://localhost:3001/api/processes | grep -o '"id":' | wc -l)
if [ "$COUNT" -gt 0 ]; then
  echo "✅ PASS ($COUNT processes)"
else
  echo "❌ FAIL"
  exit 1
fi

# Testar stats
echo -n "Get stats... "
RESPONSE=$(curl -s http://localhost:3001/api/stats)
if echo "$RESPONSE" | grep -q '"total"'; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

echo ""
echo "✅ All smoke tests passed!"
```

### Script 2: Teste Completo

Criar `tests/full-test.sh`:

```bash
#!/bin/bash

echo "🧪 PortOps Full Test Suite"
echo "=========================="

API_URL="http://localhost:3001"
PASS_COUNT=0
FAIL_COUNT=0

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
    ((FAIL_COUNT++))
  fi
}

# Testes
run_test "Health check" "curl -s $API_URL/health" '"status":"ok"'

# Criar processo
RESPONSE=$(curl -s -X POST $API_URL/api/processes \
  -H "Content-Type: application/json" \
  -d '{"vesselName":"TEST VESSEL","client":"Test Client","port":"Test Port","coordinator":"Test User"}')
PROCESS_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

run_test "Create process" "echo '$RESPONSE'" '"id"'

# Obter processo
run_test "Get process" "curl -s $API_URL/api/processes/$PROCESS_ID" '"vesselName":"TEST VESSEL"'

# Atualizar processo
run_test "Update process" "curl -s -X PATCH $API_URL/api/processes/$PROCESS_ID -H 'Content-Type: application/json' -d '{\"vesselName\":\"UPDATED\"}'" '"vesselName":"UPDATED"'

# Obter autorização
AUTH_ID=$(curl -s $API_URL/api/processes/$PROCESS_ID | grep -o '"authorizations":\[[^]]*' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Atualizar autorização
run_test "Update authorization" "curl -s -X PATCH $API_URL/api/authorizations/$AUTH_ID -H 'Content-Type: application/json' -d '{\"status\":\"RECEIVED\"}'" '"status":"RECEIVED"'

# Obter marco
MS_ID=$(curl -s $API_URL/api/processes/$PROCESS_ID | grep -o '"milestones":\[[^]]*' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Confirmar marco
run_test "Confirm milestone" "curl -s -X PATCH $API_URL/api/milestones/$MS_ID -H 'Content-Type: application/json' -d '{\"confirmed\":true}'" '"confirmed":true'

# Obter fatura
INV_ID=$(curl -s $API_URL/api/processes/$PROCESS_ID | grep -o '"invoices":\[[^]]*' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Atualizar fatura
run_test "Update invoice" "curl -s -X PATCH $API_URL/api/invoices/$INV_ID -H 'Content-Type: application/json' -d '{\"status\":\"RECEIVED\",\"reference\":\"INV-001\",\"amount\":10000}'" '"status":"RECEIVED"'

# Adicionar ficheiro
run_test "Add file" "curl -s -X POST $API_URL/api/processes/$PROCESS_ID/files -H 'Content-Type: application/json' -d '{\"name\":\"test.pdf\",\"originalName\":\"Test.pdf\",\"mimeType\":\"application/pdf\",\"size\":1000,\"url\":\"#test\",\"storageKey\":\"test\",\"storageMode\":\"Local\"}'" '"id"'

# Stats
run_test "Get stats" "curl -s $API_URL/api/stats" '"total"'

# Encerrar processo
run_test "Close process" "curl -s -X POST $API_URL/api/processes/$PROCESS_ID/close" '"status":"CLOSED"'

# Resumo
echo ""
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
```

### Script 3: Teste de Carga

Criar `tests/load-test.sh`:

```bash
#!/bin/bash

echo "🧪 PortOps Load Test"
echo "===================="

API_URL="http://localhost:3001"
NUM_PROCESSES=50

echo "Creating $NUM_PROCESSES processes..."

START_TIME=$(date +%s)

for i in $(seq 1 $NUM_PROCESSES); do
  curl -s -X POST $API_URL/api/processes \
    -H "Content-Type: application/json" \
    -d "{\"vesselName\":\"LOAD TEST $i\",\"client\":\"Client $i\",\"port\":\"Port $i\",\"coordinator\":\"User $i\"}" > /dev/null &
done

wait

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Created $NUM_PROCESSES processes in ${DURATION}s"
echo "Average: $(echo "scale=2; $DURATION / $NUM_PROCESSES" | bc)s per process"

# Verificar contagem
COUNT=$(curl -s $API_URL/api/processes | grep -o '"id":' | wc -l)
echo "Total processes in database: $COUNT"
```

---

## 📊 Dados de Teste

### Script de Seed (Popular Base de Dados)

Criar `tests/seed-data.sql`:

```sql
-- Inserir 10 processos de teste

INSERT INTO processes (id, fileNumber, srfNumber, vesselName, imo, client, port, terminal, coordinator, status, progress) VALUES
('test-1', '100001', 'SRF-2026-1001', 'TEST VESSEL 1', '1000001', 'Client A', 'Porto de Sines', 'Terminal XXI', 'Coordinator 1', 'OPEN', 25),
('test-2', '100002', 'SRF-2026-1002', 'TEST VESSEL 2', '1000002', 'Client B', 'Porto de Leixões', 'Terminal Norte', 'Coordinator 2', 'OPEN', 50),
('test-3', '100003', 'SRF-2026-1003', 'TEST VESSEL 3', '1000003', 'Client A', 'Porto de Lisboa', 'Terminal Alcântara', 'Coordinator 1', 'OPEN', 75),
('test-4', '100004', 'SRF-2026-1004', 'TEST VESSEL 4', '1000004', 'Client C', 'Porto de Sines', 'Terminal XXI', 'Coordinator 3', 'CLOSED', 100),
('test-5', '100005', 'SRF-2026-1005', 'TEST VESSEL 5', '1000005', 'Client B', 'Porto de Setúbal', 'Terminal Sul', 'Coordinator 2', 'OPEN', 10);

-- Inserir autorizações para cada processo
INSERT INTO authorizations (id, processId, entity, reason, status) VALUES
('auth-1-1', 'test-1', 'Saúde Portuária', 'Inspeção sanitária', 'RECEIVED'),
('auth-1-2', 'test-1', 'Alfândega', 'Declaração de carga', 'PENDING'),
('auth-1-3', 'test-1', 'Imigração', 'Controlo tripulação', 'PENDING'),
('auth-1-4', 'test-1', 'Polícia Marítima', 'Segurança', 'NOT_APPLICABLE'),
('auth-1-5', 'test-1', 'Intransmar', 'Agência', 'PENDING');

-- Inserir marcos para cada processo
INSERT INTO milestones (id, processId, name, description, "order", confirmed) VALUES
('ms-1-1', 'test-1', 'Receção do Pedido', 'Pedido recebido', 1, true),
('ms-1-2', 'test-1', 'Agendamento', 'Escala agendada', 2, true),
('ms-1-3', 'test-1', 'Notificação', 'Autoridades notificadas', 3, false),
('ms-1-4', 'test-1', 'Chegada (ATA)', 'Navio atracado', 4, false),
('ms-1-5', 'test-1', 'Início Operações', 'Operações iniciadas', 5, false);

-- Inserir faturas para cada processo
INSERT INTO invoices (id, processId, entity, description, status, amount) VALUES
('inv-1-1', 'test-1', 'PBT', 'Taxas Portuárias', 'RECEIVED', 50000),
('inv-1-2', 'test-1', 'Terminal', 'Taxas Terminal', 'AWAITING', NULL),
('inv-1-3', 'test-1', 'Rebocadores', 'Rebocagem', 'AWAITING', NULL);

-- Inserir eventos
INSERT INTO timeline_events (id, processId, action, description, user) VALUES
('evt-1-1', 'test-1', 'Ficheiro Criado', 'Operação registada', 'Sistema'),
('evt-1-2', 'test-1', 'Autorização Atualizada', 'Saúde Portuária: Recebida', 'Coordenador');
```

Executar:
```bash
psql -U postgres -d portops_test -f tests/seed-data.sql
```

---

## ✅ Checklist de Validação

### Frontend (Modo Local)

- [ ] Dashboard carrega sem erros
- [ ] 7 métricas visíveis e corretas
- [ ] Tabela de processos renderiza
- [ ] Pesquisa funciona (navio, cliente, porto)
- [ ] Filtro por estado funciona
- [ ] Nova operação cria com sucesso
- [ ] Validação de campos obrigatórios
- [ ] Detalhes da operação abre
- [ ] 6 separadores funcionais
- [ ] Edição inline funciona
- [ ] Autorizações atualizam
- [ ] Marcos confirmam
- [ ] Faturas atualizam
- [ ] Upload de ficheiros (local)
- [ ] Timeline atualiza
- [ ] Encerramento funciona
- [ ] Progresso calcula corretamente
- [ ] Persistência em localStorage

### Backend API

- [ ] Health check responde
- [ ] POST /api/processes cria
- [ ] GET /api/processes lista
- [ ] GET /api/processes/:id obtém
- [ ] PATCH /api/processes/:id atualiza
- [ ] POST /api/processes/:id/close encerra
- [ ] PATCH /api/authorizations/:id atualiza
- [ ] PATCH /api/milestones/:id confirma
- [ ] PATCH /api/invoices/:id atualiza
- [ ] POST /api/processes/:id/files adiciona
- [ ] DELETE /api/files/:id remove
- [ ] GET /api/stats retorna estatísticas
- [ ] Cascade delete funciona
- [ ] Validações funcionam
- [ ] Error handling adequado

### Base de Dados

- [ ] Todas as tabelas criadas
- [ ] Relacionamentos corretos
- [ ] Índices criados
- [ ] Constraints funcionam
- [ ] Cascade delete funciona
- [ ] Dados inseridos corretamente
- [ ] Queries funcionam
- [ ] Performance aceitável

### Integração (Sem SharePoint)

- [ ] Modo local funciona
- [ ] Metadados guardados em PostgreSQL
- [ ] Referências a ficheiros guardadas
- [ ] Upload simulado funciona
- [ ] Visualização de links funciona
- [ ] Remoção de referências funciona

---

## 🎯 Resumo

Este guia permite testar **todo o sistema** sem necessidade de:
- ❌ Conta SharePoint
- ❌ Microsoft 365
- ❌ Azure AD

Apenas precisa de:
- ✅ Node.js
- ✅ PostgreSQL
- ✅ Navegador

**Tempo estimado para testes completos:** 30-45 minutos

**Cobertura:** 100% das funcionalidades do MVP

---

<div align="center">

**PortOps — Guia de Testes**

*Testar sem SharePoint é possível!*

</div>
