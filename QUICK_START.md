# 🚀 Quick Start - Testar sem SharePoint

Guia rápido para testar o PortOps em 5 minutos sem precisar de conta SharePoint.

---

## 📋 O que vais precisar

- ✅ Node.js 18+
- ✅ PostgreSQL 12+
- ✅ Navegador moderno (Chrome, Firefox, Edge)
- ❌ **NÃO** precisa de conta SharePoint
- ❌ **NÃO** precisa de Microsoft 365
- ❌ **NÃO** precisa de Azure AD

---

## 🎯 Objetivo

Testar **todas as funcionalidades** do sistema usando apenas:
- **Frontend** (React) — Interface do utilizador
- **Backend** (Express) — API REST
- **PostgreSQL** — Base de dados
- **Modo Local** — Ficheiros guardados como referências

---

## ⚡ Instalação Rápida (5 minutos)

### 1. Clonar e Instalar Frontend

```bash
# Clonar repositório
git clone https://github.com/ArcidesFerrao/portcalls-mvp.git
cd portcalls-mvp

# Instalar dependências
npm install
```

### 2. Configurar Base de Dados

```bash
# Ir para pasta do servidor
cd server

# Instalar dependências
npm install

# Copiar ficheiro de configuração
cp .env.example .env
```

### 3. Editar `.env`

Abrir `server/.env` e configurar:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/portops_test"
PORT=3001
```

**Nota:** Ajustar `password` para a password do PostgreSQL.

### 4. Criar Base de Dados

```bash
# Aceder ao PostgreSQL
psql -U postgres

# Criar base de dados
CREATE DATABASE portops_test;

# Sair
\q
```

### 5. Executar Migrações

```bash
# Na pasta server/
npm run db:generate
npm run db:push
```

### 6. Iniciar Backend

```bash
# Na pasta server/
npm run dev
```

**Deixa esta janela aberta.** O servidor está a correr em `http://localhost:3001`

### 7. Iniciar Frontend (nova janela)

```bash
# Na pasta raiz (portcalls-mvp/)
npm run dev
```

O frontend está a correr em `http://localhost:5173`

---

## 🧪 Teste Rápido (2 minutos)

### 1. Abrir Browser

Aceder a: **http://localhost:5173**

### 2. Configurar Modo Local

1. Clicar em **"Configuração"** (ícone ⚙️)
2. Selecionar **"Local"** como modo de armazenamento
3. Clicar em **"Continuar"**

### 3. Verificar Dashboard

Deves ver:
- ✅ 7 cards de métricas no topo
- ✅ Tabela com 5 operações demo
- ✅ Barra de pesquisa
- ✅ Filtro por estado

### 4. Criar Operação de Teste

1. Clicar em **"Nova Operação"**
2. Preencher:
   - **Navio:** `TEST VESSEL`
   - **Cliente:** `Test Client`
   - **Porto:** `Porto de Teste`
   - **Coordenador:** `Test User`
3. Clicar em **"Criar Operação"**

### 5. Explorar Detalhes

Deves ver 6 separadores:
- ✅ **Geral** — Dados da operação
- ✅ **Autorizações** — 5 entidades
- ✅ **Marcos** — 10 etapas
- ✅ **Faturas** — 6 entidades
- ✅ **Documentos** — Upload local
- ✅ **Histórico** — Timeline

### 6. Testar Funcionalidades

**Autorizações:**
- Clicar em **"Recebido"** numa autorização
- Deve ficar verde

**Marcos:**
- Clicar no toggle de um marco
- Deve ativar e mostrar data

**Faturas:**
- Clicar em **"Marcar Recebida"**
- Preencher referência e valor
- Clicar em **"Confirmar"**

**Documentos:**
- Clicar em **"Adicionar"**
- Selecionar um ficheiro PDF
- Deve aparecer na lista

**Encerrar:**
- Clicar em **"Encerrar"**
- Confirmar no modal
- Progresso deve ir para 100%

---

## 🤖 Teste Automatizado

### Smoke Test (10 segundos)

```bash
# Na pasta raiz
chmod +x tests/smoke-test.sh
./tests/smoke-test.sh
```

**Resultado esperado:**
```
✅ All smoke tests passed!
```

### Full Test (30 segundos)

```bash
chmod +x tests/full-test.sh
./tests/full-test.sh
```

**Resultado esperado:**
```
✅ Passed: 20
❌ Failed: 0
🎉 All tests passed!
```

---

## 📊 O que foi testado

### ✅ Funcionalidades Validadas

| Funcionalidade | Status |
|----------------|--------|
| Dashboard com métricas | ✅ |
| Pesquisa de operações | ✅ |
| Filtro por estado | ✅ |
| Criação de operação | ✅ |
| Visualização de detalhes | ✅ |
| Edição de dados | ✅ |
| Gestão de autorizações | ✅ |
| Confirmação de marcos | ✅ |
| Gestão de faturas | ✅ |
| Upload de documentos (local) | ✅ |
| Timeline de eventos | ✅ |
| Encerramento de operação | ✅ |
| Cálculo de progresso | ✅ |
| Persistência em PostgreSQL | ✅ |

### ❌ Não testado (requer SharePoint)

| Funcionalidade | Nota |
|----------------|------|
| Upload real para SharePoint | Requer conta Microsoft 365 |
| Visualização via SharePoint | Requer conta Microsoft 365 |
| Partilha entre departamentos | Requer SharePoint configurado |

---

## 🎓 Próximos Passos

### 1. Explorar Mais

- Criar várias operações
- Testar pesquisa avançada
- Explorar todos os separadores
- Verificar histórico de eventos

### 2. Testar Casos Limite

- Criar operação com todos os campos
- Tentar criar operação sem campos obrigatórios
- Encerrar operação com pendências
- Adicionar múltiplos ficheiros

### 3. Verificar Base de Dados

```bash
psql -U postgres -d portops_test

# Ver processos criados
SELECT id, "fileNumber", "vesselName", status FROM processes;

# Ver autorizações
SELECT * FROM authorizations LIMIT 5;

# Ver marcos
SELECT * FROM milestones LIMIT 5;

# Sair
\q
```

### 4. Ler Documentação

- `README.md` — Visão geral do projeto
- `DOCUMENTACAO_OFICIAL.md` — Documentação técnica completa
- `TESTING_GUIDE.md` — Guia detalhado de testes
- `server/README.md` — Documentação do backend

---

## 🐛 Problemas Comuns

### "Server is not running"
**Solução:** Iniciar o backend com `cd server && npm run dev`

### "Connection refused"
**Solução:** Verificar se PostgreSQL está a correr e credenciais corretas

### "Database not found"
**Solução:** Criar base de dados com `CREATE DATABASE portops_test;`

### "Permission denied" (scripts)
**Solução:** Executar `chmod +x tests/*.sh`

---

## 🎉 Parabéns!

Acabaste de testar o **PortOps** sem precisar de SharePoint!

### O que aprendeste:
- ✅ Como instalar o sistema
- ✅ Como configurar base de dados
- ✅ Como usar o modo local
- ✅ Como testar todas as funcionalidades
- ✅ Como executar testes automatizados

### O que podes fazer agora:
- 🚀 Deploy para produção
- 🔌 Integrar com SharePoint (quando disponível)
- 👥 Adicionar autenticação de utilizadores
- 📊 Implementar relatórios avançados

---

## 📞 Suporte

- **Documentação:** `DOCUMENTACAO_OFICIAL.md`
- **Testes:** `TESTING_GUIDE.md`
- **Backend:** `server/README.md`
- **GitHub:** [ArcidesFerrao/portcalls-mvp](https://github.com/ArcidesFerrao/portcalls-mvp)

---

<div align="center">

**PortOps — Quick Start**

*Testar sem SharePoint é possível!*

⚡ 5 minutos para instalar  
🧪 2 minutos para testar  
✅ 100% funcional sem SharePoint

</div>
