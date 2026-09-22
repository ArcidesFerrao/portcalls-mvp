# 🧪 PortOps - Testes

Scripts de teste automatizados para validar o sistema PortOps.

## 📋 Scripts Disponíveis

### 1. Smoke Test (`smoke-test.sh`)
Teste rápido de 5 minutos para verificar se o sistema está funcional.

**O que testa:**
- Servidor está a correr
- Health check
- Criação de processo
- Listagem de processos
- Obtenção de processo
- Estatísticas

**Como executar:**
```bash
chmod +x tests/smoke-test.sh
./tests/smoke-test.sh
```

### 2. Full Test (`full-test.sh`)
Teste completo que valida todas as funcionalidades da API.

**O que testa:**
- Todos os endpoints da API
- Criação, leitura, atualização, eliminação (CRUD)
- Autorizações, marcos, faturas
- Upload de ficheiros
- Encerramento de processos
- Estatísticas

**Como executar:**
```bash
chmod +x tests/full-test.sh
./tests/full-test.sh
```

## 🚀 Como Usar

### Pré-requisitos

1. **Base de dados PostgreSQL** criada e configurada
2. **Backend** a correr:
```bash
cd server
npm run dev
```

### Executar Testes

```bash
# 1. Smoke test (rápido)
./tests/smoke-test.sh

# 2. Full test (completo)
./tests/full-test.sh
```

## 📊 Resultados Esperados

### Smoke Test
```
🧪 PortOps Smoke Test
=====================
Checking if server is running... ✅ Server is running
Health check... ✅ PASS
Create process... ✅ PASS (ID: clxyz123...)
List processes... ✅ PASS (1 processes)
Get process... ✅ PASS
Get stats... ✅ PASS
Cleanup... ✅ Done

✅ All smoke tests passed!
```

### Full Test
```
🧪 PortOps Full Test Suite
==========================
Checking if server is running... ✅ Server is running

=== Basic Tests ===
Health check... ✅ PASS

=== Process Tests ===
✅ Created test process (ID: clxyz123...)
Get process by ID... ✅ PASS
Process has authorizations... ✅ PASS
...

==========================
Test Results:
==========================
✅ Passed: 20
❌ Failed: 0
==========================
🎉 All tests passed!
```

## 🧪 Teste Manual (Frontend)

### 1. Iniciar Frontend
```bash
npm run dev
```

### 2. Abrir Browser
```
http://localhost:5173
```

### 3. Configurar Modo Local
1. Aceder a `/setup`
2. Selecionar "Local"
3. Clicar "Continuar"

### 4. Testar Funcionalidades
- ✅ Dashboard carrega com dados demo
- ✅ Criar nova operação
- ✅ Ver detalhes da operação
- ✅ Editar dados
- ✅ Confirmar autorizações
- ✅ Confirmar marcos
- ✅ Atualizar faturas
- ✅ Upload de ficheiros (local)
- ✅ Ver histórico
- ✅ Encerrar operação

## 🗄️ Teste da Base de Dados

### Verificar Tabelas
```bash
psql -U postgres -d portops_test
\dt
```

**Tabelas esperadas:**
- processes
- authorizations
- milestones
- invoices
- files
- timeline_events

### Verificar Dados
```sql
-- Contar processos
SELECT COUNT(*) FROM processes;

-- Ver processos
SELECT id, "fileNumber", "vesselName", status FROM processes;

-- Ver autorizações
SELECT * FROM authorizations LIMIT 5;

-- Ver marcos
SELECT * FROM milestones LIMIT 5;

-- Ver faturas
SELECT * FROM invoices LIMIT 5;
```

### Popular com Dados de Teste
```bash
psql -U postgres -d portops_test < tests/seed-data.sql
```

## 🐛 Troubleshooting

### Erro: "Server is not running"
**Solução:**
```bash
cd server
npm run dev
```

### Erro: "Connection refused"
**Solução:**
- Verificar se PostgreSQL está a correr
- Verificar credenciais em `server/.env`
- Verificar se a base de dados existe

### Erro: "Database not found"
**Solução:**
```bash
psql -U postgres
CREATE DATABASE portops_test;
\q

cd server
npm run db:push
```

### Erro: "Permission denied" (scripts)
**Solução:**
```bash
chmod +x tests/*.sh
```

## 📈 Métricas de Teste

| Teste | Tempo Estimado | Cobertura |
|-------|----------------|-----------|
| Smoke Test | 10 segundos | 20% |
| Full Test | 30 segundos | 80% |
| Manual Frontend | 15 minutos | 100% |
| Database Tests | 5 minutos | 100% |

## ✅ Checklist de Validação

### Backend API
- [ ] Health check funciona
- [ ] CRUD de processos funciona
- [ ] CRUD de autorizações funciona
- [ ] CRUD de marcos funciona
- [ ] CRUD de faturas funciona
- [ ] CRUD de ficheiros funciona
- [ ] Estatísticas funcionam
- [ ] Encerramento funciona

### Frontend
- [ ] Dashboard carrega
- [ ] Pesquisa funciona
- [ ] Filtros funcionam
- [ ] Criação funciona
- [ ] Edição funciona
- [ ] Upload funciona
- [ ] Timeline funciona

### Base de Dados
- [ ] Todas as tabelas existem
- [ ] Relacionamentos corretos
- [ ] Dados persistem
- [ ] Cascade delete funciona

## 🎯 Objetivo

Testar **100% das funcionalidades** do sistema sem necessidade de:
- ❌ Conta SharePoint
- ❌ Microsoft 365
- ❌ Azure AD

Apenas com:
- ✅ Node.js
- ✅ PostgreSQL
- ✅ Navegador

---

**PortOps Testing Suite**  
*Testar sem SharePoint é possível!*
