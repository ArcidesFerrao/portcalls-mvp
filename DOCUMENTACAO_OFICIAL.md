# PortOps — Documentação Oficial do Sistema

**Sistema de Gestão de Operações Portuárias**  
**Versão:** 1.0.0  
**Data:** Setembro 2026  
**Autor:** Arcides Ferrão

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Objetivos do Sistema](#2-objetivos-do-sistema)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Componentes Principais](#4-componentes-principais)
5. [Fluxo de Dados](#5-fluxo-de-dados)
6. [Modelo de Dados](#6-modelo-de-dados)
7. [Configuração e Instalação](#7-configuração-e-instalação)
8. [Utilização do Sistema](#8-utilização-do-sistema)
9. [Integração com SharePoint](#9-integração-com-sharepoint)
10. [Segurança](#10-segurança)
11. [Manutenção e Suporte](#11-manutenção-e-suporte)
12. [Apêndices](#12-apêndices)

---

## 1. Visão Geral

### 1.1 Descrição do Sistema

O **PortOps** é um sistema web desenvolvido para a gestão completa de operações portuárias, permitindo o registo, acompanhamento e encerramento de escalas de navios em portos. O sistema garante o controlo integral de documentos, autorizações legais, faturas e prazos associados a cada operação.

### 1.2 Contexto de Utilização

O sistema foi concebido para responder às necessidades operacionais de:
- **Coordenadores de Operações** — gestão diária das escalas
- **Gestores de Ficheiros** — supervisão do progresso e pendências
- **Departamento Financeiro** — controlo de faturas e handover

### 1.3 Âmbito

O PortOps cobre todo o ciclo de vida de uma operação portuária:
1. Receção do pedido e criação do ficheiro
2. Notificação às autoridades portuárias
3. Chegada do navio e operações
4. Recolha de faturas
5. Handover financeiro
6. Encerramento do ficheiro

---

## 2. Objetivos do Sistema

### 2.1 Objetivos Principais

- **Centralização** — Todas as informações de uma operação num único local
- **Rastreabilidade** — Histórico completo de eventos e alterações
- **Controlo de Pendências** — Monitorização em tempo real de itens pendentes
- **Partilha de Documentos** — Integração com SharePoint para acesso multi-departamental
- **Automação** — Cálculo automático de progresso e alertas

### 2.2 Objetivos Secundários

- **Redução de Erros** — Validações e verificações automáticas
- **Eficiência Operacional** — Redução de tempo na gestão de processos
- **Compliance** — Garantia de cumprimento de requisitos legais
- **Transparência** — Visibilidade total do estado de cada operação

---

## 3. Arquitetura do Sistema

### 3.1 Arquitetura Geral

O sistema segue uma arquitetura de **três camadas**:

```
┌─────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                │
│                   (Frontend - React/Vite)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │Dashboard │  │  Nova    │  │ Detalhes │              │
│  │          │  │Operação  │  │ Processo │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────┐
│                    CAMADA DE NEGÓCIO                     │
│                  (Backend - Express.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │Processes │  │   Auth   │  │  Files   │              │
│  │   API    │  │   API    │  │   API    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼─────────┐
│   CAMADA DE    │      │   CAMADA DE      │
│    DADOS       │      │  ARMAZENAMENTO   │
│  (PostgreSQL)  │      │  (SharePoint)    │
│                │      │                  │
│ • Processos    │      │ • Ficheiros      │
│ • Autorizações │      │   físicos        │
│ • Marcos       │      │ • Documentos     │
│ • Faturas      │      │ • PDFs, imagens  │
│ • Timeline     │      │                  │
└────────────────┘      └──────────────────┘
```

### 3.2 Tecnologias Utilizadas

#### Frontend
- **React 18** — Framework JavaScript para interfaces
- **TypeScript** — Tipagem estática para segurança
- **Vite** — Build tool e dev server
- **Tailwind CSS v4** — Estilização utility-first
- **React Router DOM** — Navegação entre páginas
- **Lucide React** — Ícones
- **date-fns** — Formatação de datas

#### Backend
- **Node.js** — Runtime JavaScript
- **Express.js** — Framework web
- **TypeScript** — Tipagem estática
- **Prisma ORM** — Acesso à base de dados
- **PostgreSQL** — Base de dados relacional

#### Integrações
- **Microsoft Graph API** — Acesso ao SharePoint
- **Microsoft Entra ID** — Autenticação Azure AD

### 3.3 Princípios de Design

- **Separação de Responsabilidades** — Cada camada tem funções específicas
- **API-First** — Comunicação via REST API bem definida
- **Estadoless** — Backend não mantém estado entre requests
- **Segurança por Design** — Validações em todas as camadas
- **Escalabilidade** — Arquitetura preparada para crescimento

---

## 4. Componentes Principais

### 4.1 Frontend (Aplicação Web)

#### 4.1.1 Dashboard (`/`)

**Função:** Visão global de todas as operações

**Características:**
- 7 métricas em tempo real (total, abertos, fechados, aguardando chegada/partida, faturas pendentes, críticos)
- Tabela com todas as operações
- Pesquisa por número, SRF, navio, cliente
- Filtro por estado (Aberto/Fechado)
- Indicadores visuais de progresso
- Alertas de operações críticas

#### 4.1.2 Nova Operação (`/processes/new`)

**Função:** Criar nova operação portuária

**Campos:**
- Nome do navio (obrigatório)
- Número IMO
- Cliente/Principal (obrigatório)
- Porto (obrigatório)
- Terminal
- ETA (Estimated Time of Arrival)
- ETD (Estimated Time of Departure)
- Coordenador (obrigatório)
- Observações

**Processo:**
1. Utilizador preenche formulário
2. Validação de campos obrigatórios
3. Envio para backend via POST `/api/processes`
4. Backend cria processo com dados padrão (autorizações, marcos, faturas)
5. Redirecionamento para página de detalhes

#### 4.1.3 Detalhes da Operação (`/processes/:id`)

**Função:** Gestão completa de uma operação individual

**Separadores:**

**a) Geral**
- Todos os dados da operação
- Edição inline de campos
- Datas ETA/ATA/ETD/ATD

**b) Autorizações**
- 5 entidades: Saúde Portuária, Alfândega, Imigração, Polícia Marítima, Intransmar
- Estados: Recebido | Não Aplicável | Pendente
- Atualização via PATCH `/api/authorizations/:id`

**c) Marcos da Escala**
- 10 etapas cronológicas
- Toggle de confirmação
- Auto-marcação de ATA/ATD
- Atualização via PATCH `/api/milestones/:id`

**d) Faturas**
- Secção "Em Falta" (destaque âmbar)
- Secção "Recebidas"
- Marcar como recebida com referência e valor
- Atualização via PATCH `/api/invoices/:id`

**e) Documentos**
- Upload para SharePoint
- Visualização via link SharePoint
- Remoção de ficheiros
- Indicação do modo de armazenamento

**f) Histórico**
- Timeline cronológica
- Todos os eventos registados
- Utilizador e timestamp

### 4.1.4 Configuração (`/setup`)

**Função:** Configurar integração com PostgreSQL e SharePoint

**Secções:**
1. **Base de Dados (PostgreSQL)**
   - URL da API backend
   - Validação de conexão
   - Health check

2. **Armazenamento de Documentos**
   - Seleção: SharePoint ou Local
   - Configuração SharePoint:
     - URL do site
     - Nome da biblioteca
     - Pasta raiz
     - Tenant ID, Client ID, Client Secret
   - Validação de conexão Microsoft Graph

### 4.2 Backend (API REST)

#### 4.2.1 Endpoints de Processes

```
GET    /api/processes          → Listar todos
GET    /api/processes/:id      → Obter por ID
POST   /api/processes          → Criar novo
PATCH  /api/processes/:id      → Atualizar
POST   /api/processes/:id/close → Encerrar
```

#### 4.2.2 Endpoints de Authorizations

```
PATCH  /api/authorizations/:id → Atualizar estado
```

#### 4.2.3 Endpoints de Milestones

```
PATCH  /api/milestones/:id     → Confirmar/desconfirmar
```

#### 4.2.4 Endpoints de Invoices

```
PATCH  /api/invoices/:id       → Atualizar estado
```

#### 4.2.5 Endpoints de Files

```
POST   /api/processes/:id/files → Adicionar referência
DELETE /api/files/:id           → Remover referência
```

#### 4.2.6 Endpoints de Stats

```
GET    /api/stats              → Estatísticas gerais
GET    /health                 → Health check
```

### 4.3 Base de Dados (PostgreSQL)

#### 4.3.1 Tabelas Principais

**processes** — Dados da operação
**authorizations** — Autorizações das entidades
**milestones** — Marcos da escala
**invoices** — Faturas
**files** — Referências a ficheiros
**timeline_events** — Histórico de eventos

#### 4.3.2 Relacionamentos

```
Process (1) ←→ (N) Authorization
Process (1) ←→ (N) Milestone
Process (1) ←→ (N) Invoice
Process (1) ←→ (N) File
Process (1) ←→ (N) TimelineEvent
```

**Cascade Delete:** Ao eliminar um processo, todos os registos relacionados são eliminados automaticamente.

### 4.4 SharePoint (Armazenamento de Ficheiros)

#### 4.4.1 Estrutura de Pastas

```
SharePoint Site
└── Biblioteca "Documentos"
    └── Pasta "Processos" (configurável)
        ├── {processId-1}/
        │   ├── Contrato.pdf
        │   └── Fatura.pdf
        └── {processId-2}/
            ├── Licenca.pdf
            └── Relatorio.pdf
```

#### 4.4.2 Microsoft Graph API

**Operações suportadas:**
- Autenticação (client credentials flow)
- Upload de ficheiros
- Listagem de ficheiros
- Obtenção de URLs de download
- Delete de ficheiros
- Criação de pastas

---

## 5. Fluxo de Dados

### 5.1 Criação de Operação

```
┌──────────┐
│Utilizador│
└────┬─────┘
     │ 1. Preenche formulário
     ▼
┌──────────┐
│ Frontend │
└────┬─────┘
     │ 2. POST /api/processes
     ▼
┌──────────┐
│ Backend  │
└────┬─────┘
     │ 3. INSERT INTO processes
     │ 4. INSERT INTO authorizations (5 registos)
     │ 5. INSERT INTO milestones (10 registos)
     │ 6. INSERT INTO invoices (6 registos)
     │ 7. INSERT INTO timeline_events
     ▼
┌──────────┐
│PostgreSQL│
└────┬─────┘
     │ 8. Retorna processo completo
     ▼
┌──────────┐
│ Frontend │ → Redireciona para /processes/:id
└──────────┘
```

### 5.2 Upload de Ficheiro

```
┌──────────┐
│Utilizador│
└────┬─────┘
     │ 1. Seleciona ficheiro
     ▼
┌──────────┐
│ Frontend │
└────┬─────┘
     │ 2. Autenticação Microsoft Graph
     │ 3. PUT /drives/{driveId}/items/{folderId}:/{filename}:/content
     ▼
┌──────────┐
│SharePoint│ → Ficheiro guardado
└────┬─────┘
     │ 4. Retorna itemId, webUrl
     ▼
┌──────────┐
│ Frontend │
└────┬─────┘
     │ 5. POST /api/processes/:id/files
     │    (com sharepointDriveId, sharepointItemId, sharepointWebUrl)
     ▼
┌──────────┐
│ Backend  │
└────┬─────┘
     │ 6. INSERT INTO files (apenas referência)
     ▼
┌──────────┐
│PostgreSQL│ → Referência guardada
└──────────┘
```

### 5.3 Consulta de Operação

```
┌──────────┐
│Utilizador│
└────┬─────┘
     │ 1. Acede a /processes/:id
     ▼
┌──────────┐
│ Frontend │
└────┬─────┘
     │ 2. GET /api/processes/:id
     ▼
┌──────────┐
│ Backend  │
└────┬─────┘
     │ 3. SELECT com JOINs (include: authorizations, milestones, invoices, files, events)
     ▼
┌──────────┐
│PostgreSQL│
└────┬─────┘
     │ 4. Retorna processo completo
     ▼
┌──────────┐
│ Frontend │ → Mostra dados
│          │ → Links para SharePoint (webUrl)
└──────────┘
```

### 5.4 Atualização de Autorização

```
┌──────────┐
│Utilizador│
└────┬─────┘
     │ 1. Clica "Recebido"
     ▼
┌──────────┐
│ Frontend │
└────┬─────┘
     │ 2. PATCH /api/authorizations/:id { status: 'RECEIVED' }
     ▼
┌──────────┐
│ Backend  │
└────┬─────┘
     │ 3. UPDATE authorizations SET status='RECEIVED', receivedAt=NOW()
     │ 4. INSERT INTO timeline_events
     ▼
┌──────────┐
│PostgreSQL│
└────┬─────┘
     │ 5. Retorna atualização
     ▼
┌──────────┐
│ Frontend │ → Atualiza UI
└──────────┘
```

---

## 6. Modelo de Dados

### 6.1 Diagrama Entidade-Relacionamento

```
┌─────────────────┐
│    processes    │
├─────────────────┤
│ id (PK)         │
│ fileNumber (U)  │
│ srfNumber (U)   │
│ vesselName      │
│ imo             │
│ client          │
│ port            │
│ terminal        │
│ eta             │
│ ata             │
│ etd             │
│ atd             │
│ coordinator     │
│ status          │
│ progress        │
│ observations    │
│ createdAt       │
│ updatedAt       │
│ closedAt        │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┬──────────────┐
         │              │              │              │              │
         ▼              ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│authorizations│ │  milestones  │ │   invoices   │ │    files     │ │timeline_events│
├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤
│ id (PK)      │ │ id (PK)      │ │ id (PK)      │ │ id (PK)      │ │ id (PK)      │
│ processId(FK)│ │ processId(FK)│ │ processId(FK)│ │ processId(FK)│ │ processId(FK)│
│ entity       │ │ name         │ │ entity       │ │ name         │ │ action       │
│ reason       │ │ description  │ │ description  │ │ originalName │ │ description  │
│ status       │ │ date         │ │ reference    │ │ mimeType     │ │ timestamp    │
│ receivedAt   │ │ confirmed    │ │ status       │ │ size         │ │ user         │
└──────────────┘ │ order        │ │ amount       │ │ url          │ └──────────────┘
                 └──────────────┘ │ receivedAt   │ │ storageKey   │
                                  │ dueDate      │ │ sharepoint...│
                                  └──────────────┘ │ storageMode  │
                                                   └──────────────┘
```

### 6.2 Especificação de Campos

#### processes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | Identificador único |
| fileNumber | String (unique) | Número do ficheiro (ex: "309722") |
| srfNumber | String (unique) | Referência SRF (ex: "SRF-2026-1234") |
| vesselName | String | Nome do navio |
| imo | String? | Número IMO |
| client | String | Cliente/Principal |
| port | String | Porto |
| terminal | String? | Terminal |
| eta | DateTime? | Estimated Time of Arrival |
| ata | DateTime? | Actual Time of Arrival |
| etd | DateTime? | Estimated Time of Departure |
| atd | DateTime? | Actual Time of Departure |
| coordinator | String | Coordenador de operações |
| status | Enum | OPEN \| CLOSED |
| progress | Int | 0-100 |
| observations | String? | Observações |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de última atualização |
| closedAt | DateTime? | Data de encerramento |

#### files

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | Identificador único |
| processId | String (FK) | ID do processo |
| name | String | Nome do ficheiro |
| originalName | String | Nome original |
| mimeType | String | Tipo MIME |
| size | Int | Tamanho em bytes |
| url | String | URL de acesso |
| storageKey | String | Chave de armazenamento |
| sharepointDriveId | String? | ID do drive SharePoint |
| sharepointItemId | String? | ID do item SharePoint |
| sharepointWebUrl | String? | URL web do SharePoint |
| storageMode | String | "Local" \| "SharePoint" |
| createdAt | DateTime | Data de criação |

---

## 7. Configuração e Instalação

### 7.1 Pré-requisitos

**Sistema:**
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

**SharePoint (opcional):**
- Microsoft 365 com SharePoint
- Azure AD com aplicação registada
- Permissões: Sites.ReadWrite.All, Files.ReadWrite.All

### 7.2 Instalação do Frontend

```bash
# Clonar repositório
git clone https://github.com/ArcidesFerrao/portcalls-mvp.git
cd portcalls-mvp

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

### 7.3 Instalação do Backend

```bash
# Ir para pasta do servidor
cd server

# Instalar dependências
npm install

# Configurar base de dados
cp .env.example .env
# Editar .env com DATABASE_URL

# Criar base de dados
psql -U postgres
CREATE DATABASE portops;

# Executar migrações
npm run db:generate
npm run db:push

# Iniciar servidor
npm run dev
```

### 7.4 Configuração da Aplicação

1. Aceder a `http://localhost:5173/setup`
2. Configurar URL da API (ex: `http://localhost:3001`)
3. Validar conexão
4. Configurar SharePoint (se aplicável)
5. Guardar configuração

---

## 8. Utilização do Sistema

### 8.1 Fluxo de Trabalho Padrão

#### Fase 1: Abertura
1. Aceder ao Dashboard
2. Clicar em "Nova Operação"
3. Preencher dados do navio, cliente, porto
4. Definir ETA/ETD
5. Atribuir coordenador
6. Criar operação

#### Fase 2: Notificação
1. Aceder à operação criada
2. Separador "Autorizações"
3. Notificar entidades (Saúde, Alfândega, etc.)
4. Marcar como "Recebido" quando confirmado

#### Fase 3: Chegada e Operações
1. Separador "Marcos"
2. Confirmar "Chegada do Navio (ATA)" — auto-preenche ATA
3. Confirmar "Início de Operações"
4. Confirmar "Fim de Operações"
5. Confirmar "Partida do Navio (ATD)" — auto-preenche ATD

#### Fase 4: Recolha de Faturas
1. Separador "Faturas"
2. Receber faturas das entidades
3. Marcar como "Recebida" com referência e valor
4. Upload de PDFs para SharePoint

#### Fase 5: Handover Financeiro
1. Confirmar marco "Handover Financeiro"
2. Entregar documentação à contabilidade

#### Fase 6: Encerramento
1. Verificar todas as pendências resolvidas
2. Clicar em "Encerrar"
3. Confirmar encerramento

### 8.2 Gestão de Documentos

#### Upload para SharePoint
1. Aceder à operação
2. Separador "Documentos"
3. Clicar em "Adicionar"
4. Selecionar ficheiro
5. Upload automático para SharePoint
6. Referência guardada no PostgreSQL

#### Visualização
1. Clicar no ícone "Ver" (olho)
2. Abre link do SharePoint em nova tab
3. Documento visualizado diretamente

#### Remoção
1. Clicar no ícone "Remover" (lixo)
2. Confirmar remoção
3. Ficheiro eliminado do SharePoint
4. Referência eliminada do PostgreSQL

### 8.3 Pesquisa e Filtros

#### Pesquisa
- Campo de pesquisa no Dashboard
- Pesquisa por: número, SRF, navio, cliente, porto, coordenador
- Pesquisa em tempo real

#### Filtros
- Dropdown de estado: Todos | Abertos | Fechados
- Combinação com pesquisa

### 8.4 Monitorização de Progresso

#### Indicadores Visuais
- Barra de progresso (0-100%)
- Círculo de progresso na página de detalhes
- Cálculo automático baseado em:
  - Autorizações recebidas (25%)
  - Marcos confirmados (35%)
  - Faturas recebidas (30%)
  - Estado do processo (10%)

#### Alertas Críticos
- Badge vermelho se ≥5 pendências
- Badge vermelho se ETD < 48h
- Contagem de pendências por separador

---

## 9. Integração com SharePoint

### 9.1 Arquitetura de Integração

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │
       ├─→ Microsoft Graph API (ficheiros)
       │
       └─→ Backend API (referências)
              │
              └─→ PostgreSQL (metadados)
```

### 9.2 Autenticação Microsoft Graph

**Fluxo:** Client Credentials Flow

```
1. Frontend solicita upload
2. Backend obtém access token
   POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
   {
     client_id: {clientId},
     client_secret: {clientSecret},
     scope: "https://graph.microsoft.com/.default",
     grant_type: "client_credentials"
   }
3. Token cacheado (válido 1h)
4. Upload do ficheiro
   PUT https://graph.microsoft.com/v1.0/drives/{driveId}/items/{folderId}:/{filename}:/content
5. Retorna itemId, webUrl
6. Guarda referência no PostgreSQL
```

### 9.3 Estrutura no SharePoint

```
Site: https://empresa.sharepoint.com/sites/portos
Biblioteca: Documentos
Pasta Raiz: Processos

Processos/
├── {processId-1}/
│   ├── Contrato.pdf
│   └── Fatura.pdf
└── {processId-2}/
    ├── Licenca.pdf
    └── Relatorio.pdf
```

### 9.4 Permissões Necessárias

**Azure AD App Registration:**
- `Sites.ReadWrite.All` — Acesso ao site SharePoint
- `Files.ReadWrite.All` — Leitura e escrita de ficheiros

**Configuração:**
1. Azure Portal → Azure Active Directory → App registrations
2. New registration
3. Copiar Application (client) ID
4. Certificates & secrets → New client secret
5. API permissions → Microsoft Graph → Application permissions
6. Adicionar Sites.ReadWrite.All e Files.ReadWrite.All
7. Grant admin consent
8. Copiar Tenant ID

### 9.5 Vantagens da Integração

✅ **Partilha entre departamentos** — Operações, Financeiro, outros acedem aos mesmos documentos  
✅ **Backup automático** — SharePoint faz backup nativo  
✅ **Controlo de versões** — Histórico de alterações  
✅ **Segurança empresarial** — Autenticação Microsoft 365  
✅ **Sem duplicação** — Ficheiros guardados uma única vez  
✅ **Acesso offline** — SharePoint suporta sincronização offline

---

## 10. Segurança

### 10.1 Segurança da Aplicação

**Frontend:**
- Validação de inputs (client-side)
- Sanitização de nomes de ficheiros
- Proteção contra XSS (React)

**Backend:**
- Validação de inputs (server-side)
- CORS configurável
- Rate limiting (recomendado)
- Error handling sem exposição de detalhes

**Base de Dados:**
- Queries parametrizadas (Prisma)
- IDs não sequenciais (cuid)
- Cascade delete controlado

### 10.2 Segurança do SharePoint

**Autenticação:**
- Client credentials flow
- Tokens com expiry (1h)
- Cache de tokens em memória

**Autorização:**
- Permissões a nível de aplicação
- Acesso apenas à biblioteca configurada
- Pasta raiz isolada

**Dados Sensíveis:**
- Client secret nunca exposto no frontend
- Credenciais guardadas no servidor
- Variáveis de ambiente para configuração

### 10.3 Recomendações de Segurança

**Produção:**
1. **HTTPS obrigatório** — Nunca usar HTTP em produção
2. **Autenticação de utilizadores** — Implementar JWT ou OAuth2
3. **Roles e permissões** — Controlar acesso por perfil
4. **Audit logs** — Registar todas as ações
5. **Backup regular** — PostgreSQL e SharePoint
6. **Monitorização** — Logs e alertas de segurança
7. **Atualizações** — Manter dependências atualizadas
8. **Firewall** — Restringir acesso à base de dados
9. **Secrets management** — Usar Azure Key Vault ou similar
10. **Penetration testing** — Testes de segurança regulares

---

## 11. Manutenção e Suporte

### 11.1 Logs

**Backend:**
- Logs na consola (desenvolvimento)
- Winston/Morgan para produção
- Estrutura: timestamp, level, message, metadata

**Frontend:**
- Console.log para debugging
- Error boundaries para captura de erros
- Sentry ou similar para produção

### 11.2 Backup

**PostgreSQL:**
```bash
# Backup manual
pg_dump -U postgres portops > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres portops < backup_20260909.sql

# Backup automático (cron)
0 2 * * * pg_dump -U postgres portops > /backups/portops_$(date +\%Y\%m\%d).sql
```

**SharePoint:**
- Backup automático nativo do SharePoint
- Retenção configurável (30 dias padrão)
- Recuperação via Admin Center

### 11.3 Monitorização

**Métricas a monitorizar:**
- Tempo de resposta da API
- Taxa de erros
- Utilização de base de dados
- Espaço em disco (PostgreSQL)
- Conexões ativas

**Ferramentas recomendadas:**
- Prometheus + Grafana
- New Relic
- Datadog
- Azure Monitor

### 11.4 Atualizações

**Frontend:**
```bash
npm update
npm run build
# Deploy
```

**Backend:**
```bash
cd server
npm update
npm run db:generate
npm run build
# Restart service
```

**Base de Dados:**
```bash
cd server
npm run db:migrate
```

### 11.5 Troubleshooting

**Problema:** Erro de conexão à base de dados  
**Solução:**
- Verificar se PostgreSQL está a correr
- Confirmar credenciais no `.env`
- Verificar se a base de dados existe

**Problema:** Erro CORS  
**Solução:**
- Adicionar URL do frontend em `CORS_ORIGINS`
- Ou usar `cors({ origin: '*' })` para desenvolvimento

**Problema:** Erro SharePoint  
**Solução:**
- Verificar credenciais Microsoft 365
- Confirmar permissões no Azure AD
- Verificar se o site/biblioteca existem

**Problema:** Token expirado  
**Solução:**
- Token renovado automaticamente
- Se persistir, reiniciar backend

---

## 12. Apêndices

### 12.1 Glossário

| Termo | Descrição |
|-------|-----------|
| **ATA** | Actual Time of Arrival — Data/hora real de chegada |
| **ATD** | Actual Time of Departure — Data/hora real de partida |
| **ETA** | Estimated Time of Arrival — Data/hora estimada de chegada |
| **ETD** | Estimated Time of Departure — Data/hora estimada de partida |
| **IMO** | Número de identificação da Organização Marítima Internacional |
| **SRF** | Referência interna do sistema |
| **Handover** | Transferência de responsabilidade (para financeiro) |
| **Escala** | Paragem de um navio num porto |

### 12.2 Entidades Portuárias

| Entidade | Função |
|----------|--------|
| **Saúde Portuária** | Inspeção sanitária do navio |
| **Alfândega** | Declaração de carga e manifesto |
| **Imigração** | Controlo de tripulação |
| **Polícia Marítima** | Segurança portuária |
| **Intransmar** | Agência marítima |

### 12.3 Marcos da Escala

| Ordem | Marco | Descrição |
|-------|-------|-----------|
| 1 | Receção do Pedido | Pedido recebido do cliente |
| 2 | Agendamento | Escala agendada com o porto |
| 3 | Notificação Autoridades | Comunicação às entidades portuárias |
| 4 | Chegada do Navio (ATA) | Navio atracado no terminal |
| 5 | Início de Operações | Operações de carga/descarga iniciadas |
| 6 | Fim de Operações | Operações concluídas |
| 7 | Partida do Navio (ATD) | Navio deixou o porto |
| 8 | Recolha de Faturas | Todas as faturas recebidas |
| 9 | Handover Financeiro | Entregue à contabilidade |
| 10 | Encerramento | Ficheiro encerrado |

### 12.4 Faturas Padrão

| Entidade | Descrição |
|----------|-----------|
| PBT | Port Charges — Taxas Portuárias |
| Terminal | Taxas de Terminal — Movimentação |
| Rebocadores | Serviço de Rebocagem |
| Praticagem | Serviço de Praticagem |
| Amarradores | Serviço de Amarração |
| Agência | Taxas de Agência Marítima |

### 12.5 Contactos de Suporte

**Desenvolvimento:**
- Arcides Ferrão
- GitHub: [@ArcidesFerrao](https://github.com/ArcidesFerrao)
- Repositório: [portcalls-mvp](https://github.com/ArcidesFerrao/portcalls-mvp)

**Suporte Técnico:**
- Documentação: [README.md](README.md)
- Backend: [server/README.md](server/README.md)

---

## Histórico de Versões

| Versão | Data | Alterações | Autor |
|--------|------|------------|-------|
| 1.0.0 | Set 2026 | Versão inicial | Arcides Ferrão |

---

<div align="center">

**PortOps — Sistema de Gestão de Operações Portuárias**

*Documento Oficial — Versão 1.0.0*

*© 2026 Arcides Ferrão. Todos os direitos reservados.*

</div>
