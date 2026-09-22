# 🧪 Como Testar o PortOps sem SharePoint

Guia completo para testar **todas as funcionalidades** do sistema sem precisar de conta SharePoint, Microsoft 365 ou Azure AD.

---

## 🎯 O que vais testar

✅ **100% das funcionalidades do MVP** usando apenas:
- Frontend (React/Vite)
- Backend (Express.js)
- PostgreSQL
- Modo Local (ficheiros como referências)

❌ **NÃO precisa de:**
- Conta SharePoint
- Microsoft 365
- Azure AD
- Microsoft Graph API

---

## 📚 Documentação Disponível

| Documento | Descrição | Tempo de Leitura |
|-----------|-----------|------------------|
| **[QUICK_START.md](QUICK_START.md)** | ⚡ Instalação e teste em 5 minutos | 5 min |
| **[TESTING_GUIDE.md](TESTING_GUIDE.md)** | 🧪 Guia completo de testes | 30 min |
| **[DOCUMENTACAO_OFICIAL.md](DOCUMENTACAO_OFICIAL.md)** | 📖 Documentação técnica completa | 60 min |

---

## 🚀 Começar Agora (5 minutos)

### 1. Instalação Rápida

```bash
# Frontend
npm install

# Backend
cd server
npm install
cp .env.example .env
# Editar .env com DATABASE_URL

# Criar base de dados
psql -U postgres
CREATE DATABASE portops_test;
\q

# Executar migrações
npm run db:generate
npm run db:push

# Iniciar backend
npm run dev

# Nova janela - Iniciar frontend
cd ..
npm run dev
```

### 2. Configurar Modo Local

1. Abrir: `http://localhost:5173/setup`
2. Selecionar **"Local"**
3. Clicar **"Continuar"**

### 3. Testar

1. Dashboard: `http://localhost:5173`
2. Ver 5 operações demo
3. Criar nova operação
4. Explorar 6 separadores
5. Testar todas as funcionalidades

---

## 🤖 Testes Automatizados

### Smoke Test (10 segundos)
```bash
chmod +x tests/smoke-test.sh
./tests/smoke-test.sh
```

### Full Test (30 segundos)
```bash
chmod +x tests/full-test.sh
./tests/full-test.sh
```

### Popular Base de Dados
```bash
psql -U postgres -d portops_test < tests/seed-data.sql
```

---

## 📊 O que foi Criado

### Scripts de Teste
- ✅ `tests/smoke-test.sh` — Teste rápido
- ✅ `tests/full-test.sh` — Teste completo
- ✅ `tests/seed-data.sql` — Dados de teste
- ✅ `tests/README.md` — Documentação dos testes

### Guias
- ✅ `QUICK_START.md` — Começar em 5 minutos
- ✅ `TESTING_GUIDE.md` — Guia completo de testes
- ✅ `DOCUMENTACAO_OFICIAL.md` — Documentação oficial

### Funcionalidades Testáveis
- ✅ Dashboard com 7 métricas
- ✅ Pesquisa e filtros
- ✅ Criação de operações
- ✅ Edição de dados
- ✅ Gestão de autorizações (5 entidades)
- ✅ Confirmação de marcos (10 etapas)
- ✅ Gestão de faturas (6 entidades)
- ✅ Upload de documentos (modo local)
- ✅ Timeline de eventos
- ✅ Encerramento de operações
- ✅ Cálculo de progresso
- ✅ Persistência em PostgreSQL

---

## 🎓 Fluxo de Teste Recomendado

### Nível 1: Básico (5 minutos)
1. ✅ Instalar e iniciar
2. ✅ Ver dashboard
3. ✅ Criar operação
4. ✅ Ver detalhes

### Nível 2: Intermédio (15 minutos)
1. ✅ Testar todos os separadores
2. ✅ Editar dados
3. ✅ Confirmar autorizações
4. ✅ Confirmar marcos
5. ✅ Atualizar faturas
6. ✅ Upload de ficheiros

### Nível 3: Avançado (30 minutos)
1. ✅ Executar scripts de teste
2. ✅ Verificar base de dados
3. ✅ Testar casos limite
4. ✅ Explorar API diretamente
5. ✅ Ler documentação completa

---

## 📋 Checklist de Validação

### Frontend
- [ ] Dashboard carrega sem erros
- [ ] 7 métricas visíveis
- [ ] Pesquisa funciona
- [ ] Filtros funcionam
- [ ] Nova operação cria
- [ ] 6 separadores funcionais
- [ ] Edição inline funciona
- [ ] Upload local funciona
- [ ] Timeline atualiza
- [ ] Encerramento funciona

### Backend API
- [ ] Health check responde
- [ ] CRUD de processos
- [ ] CRUD de autorizações
- [ ] CRUD de marcos
- [ ] CRUD de faturas
- [ ] CRUD de ficheiros
- [ ] Estatísticas funcionam
- [ ] Encerramento funciona

### Base de Dados
- [ ] Todas as tabelas existem
- [ ] Relacionamentos corretos
- [ ] Dados persistem
- [ ] Cascade delete funciona

---

## 🐛 Problemas Comuns

### "Server is not running"
```bash
cd server && npm run dev
```

### "Connection refused"
- Verificar PostgreSQL a correr
- Verificar credenciais em `server/.env`

### "Database not found"
```bash
psql -U postgres
CREATE DATABASE portops_test;
\q
```

### "Permission denied" (scripts)
```bash
chmod +x tests/*.sh
```

---

## 🎉 Resultados Esperados

### Após 5 minutos:
- ✅ Sistema instalado e a correr
- ✅ Dashboard funcional
- ✅ 1 operação criada

### Após 15 minutos:
- ✅ Todas as funcionalidades testadas
- ✅ Scripts de teste executados
- ✅ Base de dados populada

### Após 30 minutos:
- ✅ 100% do sistema validado
- ✅ Documentação lida
- ✅ Pronto para produção

---

## 📞 Suporte

| Recurso | Localização |
|---------|-------------|
| Documentação Oficial | `DOCUMENTACAO_OFICIAL.md` |
| Guia de Testes | `TESTING_GUIDE.md` |
| Quick Start | `QUICK_START.md` |
| Backend Docs | `server/README.md` |
| Testes Docs | `tests/README.md` |
| GitHub | [ArcidesFerrao/portcalls-mvp](https://github.com/ArcidesFerrao/portcalls-mvp) |

---

## 🎯 Resumo

**Testar o PortOps sem SharePoint é:**
- ⚡ **Rápido** — 5 minutos para instalar
- 🧪 **Completo** — 100% das funcionalidades testáveis
- 🤖 **Automatizado** — Scripts de teste incluídos
- 📚 **Documentado** — Guias detalhados
- ✅ **Validado** — Checklist de verificação

**Não precisa de:**
- ❌ Conta SharePoint
- ❌ Microsoft 365
- ❌ Azure AD
- ❌ Microsoft Graph API

**Apenas precisa de:**
- ✅ Node.js
- ✅ PostgreSQL
- ✅ Navegador

---

<div align="center">

## 🚀 Começar Agora

```bash
# 1. Instalar
npm install
cd server && npm install

# 2. Configurar
cp .env.example .env
# Editar .env

# 3. Base de dados
psql -U postgres -c "CREATE DATABASE portops_test;"
npm run db:push

# 4. Iniciar
npm run dev  # Backend
npm run dev  # Frontend (nova janela)

# 5. Testar
./tests/smoke-test.sh
```

**5 minutos para instalar • 2 minutos para testar • 100% funcional**

[QUICK_START.md](QUICK_START.md) • [TESTING_GUIDE.md](TESTING_GUIDE.md) • [DOCUMENTACAO_OFICIAL.md](DOCUMENTACAO_OFICIAL.md)

</div>
