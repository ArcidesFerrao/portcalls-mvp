# PortOps Server - Backend API

Servidor backend para o sistema PortOps - Gestão de Operações Portuárias.

## 📋 Descrição

Este servidor fornece a API REST para comunicação entre a aplicação frontend e a base de dados PostgreSQL da empresa. Guarda os metadados dos processos e as referências aos documentos armazenados no SharePoint.

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Frontend      │
│   (React/Vite)  │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   Backend API   │
│   (Express.js)  │
└────────┬────────┘
         │
         ├─→ PostgreSQL (metadados)
         │
         └─→ Microsoft Graph API
              │
              └─→ SharePoint (ficheiros)
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Passos

1. **Instalar dependências:**

```bash
cd server
npm install
```

2. **Configurar base de dados:**

Copie o ficheiro `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o ficheiro `.env` com as suas credenciais:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/portops?schema=public"
PORT=3001
```

3. **Criar base de dados PostgreSQL:**

```bash
# No PostgreSQL
CREATE DATABASE portops;
```

4. **Executar migrações:**

```bash
# Gerar cliente Prisma
npm run db:generate

# Criar tabelas na base de dados
npm run db:push
```

5. **Iniciar servidor:**

```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3001`

## 📡 Endpoints da API

### Processes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/processes` | Listar todos os processos |
| GET | `/api/processes/:id` | Obter processo por ID |
| POST | `/api/processes` | Criar novo processo |
| PATCH | `/api/processes/:id` | Atualizar processo |
| POST | `/api/processes/:id/close` | Encerrar processo |

### Authorizations

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| PATCH | `/api/authorizations/:id` | Atualizar autorização |

### Milestones

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| PATCH | `/api/milestones/:id` | Atualizar marco |

### Invoices

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| PATCH | `/api/invoices/:id` | Atualizar fatura |

### Files

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/processes/:id/files` | Adicionar ficheiro |
| DELETE | `/api/files/:id` | Remover ficheiro |

### Stats

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/stats` | Estatísticas gerais |
| GET | `/health` | Health check |

## 🗄️ Modelo de Dados

### Process
- `id` - Identificador único
- `fileNumber` - Número do ficheiro (único)
- `srfNumber` - Referência SRF (única)
- `vesselName` - Nome do navio
- `imo` - Número IMO
- `client` - Cliente
- `port` - Porto
- `terminal` - Terminal
- `eta` - Estimated Time of Arrival
- `ata` - Actual Time of Arrival
- `etd` - Estimated Time of Departure
- `atd` - Actual Time of Departure
- `coordinator` - Coordenador
- `status` - OPEN | CLOSED
- `progress` - 0-100
- `observations` - Observações

### File
- `id` - Identificador único
- `processId` - ID do processo
- `name` - Nome do ficheiro
- `originalName` - Nome original
- `mimeType` - Tipo MIME
- `size` - Tamanho em bytes
- `url` - URL de acesso
- `storageKey` - Chave de armazenamento
- `sharepointDriveId` - ID do drive SharePoint
- `sharepointItemId` - ID do item SharePoint
- `sharepointWebUrl` - URL web do SharePoint
- `storageMode` - "Local" | "SharePoint"

### Authorization
- `id` - Identificador único
- `processId` - ID do processo
- `entity` - Entidade (Saúde, Alfândega, etc.)
- `reason` - Motivo
- `status` - RECEIVED | NOT_APPLICABLE | PENDING
- `receivedAt` - Data de receção

### Milestone
- `id` - Identificador único
- `processId` - ID do processo
- `name` - Nome do marco
- `description` - Descrição
- `date` - Data
- `confirmed` - Confirmado (boolean)
- `order` - Ordem

### Invoice
- `id` - Identificador único
- `processId` - ID do processo
- `entity` - Entidade
- `description` - Descrição
- `reference` - Referência
- `status` - RECEIVED | AWAITING
- `amount` - Montante
- `receivedAt` - Data de receção

### TimelineEvent
- `id` - Identificador único
- `processId` - ID do processo
- `action` - Ação
- `description` - Descrição
- `timestamp` - Data/hora
- `user` - Utilizador

## 🔧 Configuração para Produção

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/portops?schema=public"

# Server
PORT=3001
NODE_ENV=production

# CORS (opcional)
CORS_ORIGINS="https://portops.empresa.com"
```

### Deploy

1. **Build:**
```bash
npm run build
```

2. **Executar:**
```bash
npm start
```

### Docker (opcional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

## 🔐 Segurança

- **CORS:** Configure as origens permitidas
- **Autenticação:** Implementar JWT ou OAuth2 para produção
- **HTTPS:** Usar sempre em produção
- **Variáveis de ambiente:** Nunca commitar `.env`
- **PostgreSQL:** Usar credenciais seguras e firewall

## 📝 Logs

Os logs são escritos na consola. Para produção, considere usar um serviço de logging como:
- Winston
- Morgan
- CloudWatch (AWS)
- Azure Monitor

## 🐛 Troubleshooting

### Erro de conexão à base de dados
- Verifique se o PostgreSQL está a correr
- Confirme as credenciais no `.env`
- Verifique se a base de dados existe

### Erro CORS
- Adicione o URL do frontend em `CORS_ORIGINS`
- Ou use `cors({ origin: '*' })` para desenvolvimento

### Erro Prisma
- Execute `npm run db:generate`
- Execute `npm run db:push`

## 📄 Licença

Proprietário - Arcides Ferrão
