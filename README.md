# 🚢 PortOps — Sistema de Gestão de Operações Portuárias

Sistema web multi-empresa para registo, acompanhamento e encerramento de operações portuárias, desde o agendamento até à partida do navio, com controlo de documentos, autorizações, faturas e prazos.

Cada empresa trabalha no seu próprio espaço, com utilizadores e permissões por papel. Em produção em **portcalls.evolurelabs.com**.

---

## 📋 Propósito

Registar, acompanhar e fechar operações de navios em portos, garantindo o controlo de:

- ✅ Documentos e autorizações legais
- ✅ Faturas de fornecedores e entidades
- ✅ Marcos da escala (agendamento, chegada, operações, partida)
- ✅ Prazos e pendências
- ✅ Handover financeiro e encerramento

---

## 🗺️ Páginas e Acesso

| Caminho              | Quem acede                      | O que é                                                   |
| -------------------- | ------------------------------- | --------------------------------------------------------- |
| `/`                  | Público                         | Página de apresentação                                    |
| `/login`             | Público                         | Entrar com e-mail e palavra-passe                         |
| `/invite/:token`     | Público (com o link do convite) | Aceitar um convite e criar a conta                        |
| `/demo`              | Público                         | Demonstração só de leitura (dados fictícios no navegador) |
| `/app`               | Com sessão                      | Painel de operações                                       |
| `/app/processes/new` | Admin, Coordenador              | Registar nova operação                                    |
| `/app/processes/:id` | Com sessão                      | Ficha da operação                                         |
| `/app/team`          | Admin                           | Equipa e convites                                         |
| `/app/settings`      | Admin                           | Configuração do armazenamento (SharePoint)                |

Os endereços antigos (`/setup`, `/processes/...`) redireccionam para os novos.

---

## 🏗️ Funcionalidades

### Nível 1 — Painel de Visão Global (Dashboard)

Lista todas as operações da empresa com métricas:

| Métrica           | Descrição                                |
| ----------------- | ---------------------------------------- |
| Total Ficheiros   | Número total de operações registadas     |
| Abertos           | Operações em curso                       |
| Fechados          | Operações encerradas                     |
| Aguard. Chegada   | Navios ainda não atracados               |
| Aguard. Partida   | Navios atracados, aguardando saída       |
| Faturas Pendentes | Faturas ainda não recebidas              |
| Críticos          | Operações com ≥5 pendências ou ETD < 48h |

**Para cada operação exibe:**

- Nº do ficheiro e SRF (referência interna)
- Nome do navio
- Barra de progresso (0-100%)
- Cliente/Principal
- Porto e Terminal
- Datas ATA/ATD (ou ETA se ainda não chegou)
- Coordenador de operações
- Estado (Aberto/Fechado)
- Contagem de itens pendentes

Pesquisa por nº de ficheiro, SRF, navio, cliente, porto e coordenador, com filtro por estado.

### Nível 2 — Ficha Detalhada (Processo Individual)

Ao aceder a uma operação, o sistema apresenta 6 separadores:

#### 1. **Geral**

- Dados do navio, cliente, porto e terminal
- Datas ETA/ATA/ETD/ATD (guardadas como instantes absolutos e mostradas na hora local)
- Coordenador (quem criou a operação) e observações
- Edição dos dados da operação

#### 2. **Autorizações**

Entidades portuárias criadas com cada operação:

- Saúde Portuária
- Alfândega
- Imigração
- Polícia Marítima
- Intransmar

Cada autorização pode estar: **Recebida** | **Não Aplicável** | **Pendente**. Voltar a clicar no estado activo repõe "Pendente".

#### 3. **Marcos da Escala**

10 etapas cronológicas com toggle de confirmação:

1. Receção do Pedido
2. Agendamento
3. Notificação Autoridades
4. Chegada do Navio (ATA) — _regista a ATA ao confirmar, e limpa-a ao desmarcar_
5. Início de Operações
6. Fim de Operações
7. Partida do Navio (ATD) — _regista a ATD ao confirmar, e limpa-a ao desmarcar_
8. Recolha de Faturas
9. Handover Financeiro
10. Encerramento

#### 4. **Faturas**

- **Secção "Em Falta"** (destaque âmbar): faturas ainda não recebidas
- **Secção "Recebidas"**: faturas com referência, valor e moeda
- Ao marcar como recebida, indica-se referência, montante e moeda (**MZN**, **USD** ou **EUR**)

#### 5. **Documentos**

- Upload de ficheiros (PDF, imagens, documentos Office, texto e CSV)
- Visualização e remoção
- Validação de tamanho (máx. 10MB) e tipo
- **Só o modo SharePoint guarda o ficheiro.** Sem SharePoint configurado, guarda-se apenas o registo do documento (a aplicação avisa na própria aba)

#### 6. **Histórico**

Timeline cronológica de todos os eventos, com o **nome real de quem fez cada ação**:

- Criação do ficheiro
- Atualizações de autorizações
- Confirmação de marcos
- Receção de faturas
- Documentos anexados e removidos
- Encerramento da operação

### Equipa e Convites (Admin)

- O administrador convida por e-mail e papel; o sistema gera um **link** (válido 7 dias) para copiar ou enviar por WhatsApp
- A pessoa abre o link, define nome e palavra-passe (mínimo 10 caracteres) e entra já na empresa certa
- O link só é mostrado uma vez (no servidor fica apenas o hash). Um novo convite para o mesmo e-mail substitui o anterior; convites pendentes podem ser revogados
- Alterar o papel de um membro ou **desativá-lo** (termina as sessões dessa pessoa de imediato)
- Ninguém altera o próprio papel nem desativa a própria conta

---

## 🔐 Autenticação e Permissões

### Sessões

- Login com e-mail e palavra-passe (hash **argon2id**)
- Sessão em cookie **httpOnly** (`Secure` em produção, `SameSite=Lax`); no servidor guarda-se apenas o hash do token
- Duração de 7 dias, renovada enquanto a pessoa usa a aplicação (`SESSION_TTL_DAYS` altera o prazo)
- Limite de tentativas de login falhadas: 10 em 15 minutos por IP
- Pedidos que alteram dados verificam o cabeçalho `Origin` (`APP_ORIGIN`)

### Papéis

| Ação                                                                  | Admin | Coordenador | Gestor | Financeiro |
| --------------------------------------------------------------------- | :---: | :---------: | :----: | :--------: |
| Consultar operações, estatísticas e histórico                         |  ✅   |     ✅      |   ✅   |     ✅     |
| Criar e editar operações, autorizações, marcos e documentos; encerrar |  ✅   |     ✅      |   —    |     —      |
| Atualizar faturas                                                     |  ✅   |     ✅      |   —    |     ✅     |
| Gerir equipa e convites                                               |  ✅   |      —      |   —    |     —      |

Os botões que um papel não pode usar ficam escondidos ou desativados, mas **quem decide é sempre o servidor**: um pedido sem permissão recebe 403.

### Isolamento entre empresas

- Cada operação, e tudo o que lhe pertence, tem o `organizationId` da empresa
- A empresa vem **sempre da sessão no servidor**, nunca do corpo ou dos parâmetros do pedido
- Os registos filhos (autorizações, marcos, faturas, ficheiros, eventos) repetem o `organizationId` com chave composta `(processId, organizationId)`, por isso a base de dados garante que pertencem à mesma empresa que o processo
- Um id de outra empresa devolve sempre 404
- Cada pessoa pertence, por agora, a uma única empresa

---

## 🎨 Design System

### Tema Visual

- **Background principal**: `#e0f5f5` (tom água/menta)
- **Background body**: `#f4f5fa` (tom azulado suave)
- **Header**: `#f8f9f7` (off-white quente com blur)
- **Border**: `#d1d5da` (cinza visível para contraste)

### Tipografia

- **Headings**: `Syne` — fonte geométrica e moderna
- **Body**: `DM Sans` — legibilidade otimizada

### Cor Primária

- `#1D9E75` — verde portuário/marítimo

### Estética

Fundo claro com componentes internos em estética dark (textos brancos, cards com `bg-surface-2`), criando um contraste elegante e profissional.

---

## 🛠️ Stack Tecnológica

```
Frontend (Vercel):
├── React 18
├── TypeScript
├── Vite
├── Tailwind CSS v4
├── React Router DOM
├── Lucide React (ícones)
├── date-fns (formatação de datas)
└── uuid (só na demonstração local)

Backend (server/, Render):
├── Node.js
├── Express.js
├── TypeScript (executado com tsx)
├── Prisma ORM
├── Zod (validação dos pedidos)
├── @node-rs/argon2 (palavras-passe)
├── cookie-parser
└── express-rate-limit

Dados:
├── PostgreSQL (Neon) — metadados, utilizadores e sessões
└── SharePoint (ficheiros físicos via Microsoft Graph API)
```

---

## 📦 Instalação (desenvolvimento)

Requisitos: Node.js 20 ou superior e um PostgreSQL (local ou, por exemplo, um projecto gratuito na Neon).

```bash
# Clonar o repositório
git clone https://github.com/ArcidesFerrao/portcalls-mvp.git
cd portcalls-mvp

# ---------- Servidor ----------
cd server
npm install
cp .env.example .env          # preencher DATABASE_URL e APP_ORIGIN
npm run db:generate
npm run db:push               # cria as tabelas

# Criar a primeira empresa e o administrador
# (mostra uma palavra-passe aleatória, uma única vez)
npm run create-admin -- "Nome da Empresa" admin@empresa.com "Nome Completo"

npm run dev                   # http://localhost:3001

# ---------- Frontend (noutro terminal, na raiz) ----------
cd ..
npm install
npm run dev                   # http://localhost:5173
```

Em desenvolvimento, o Vite reencaminha `/api` para o servidor. Em `vite.config.js`:

```js
server: { proxy: { "/api": "http://localhost:3001" } }
```

Build de produção do frontend: `npm run build`.

### Variáveis de ambiente (servidor)

| Variável           | Obrigatória | Descrição                                                                                                                                                                                                    |
| ------------------ | :---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`     |     Sim     | Ligação PostgreSQL (na Neon, com `sslmode=require`)                                                                                                                                                          |
| `APP_ORIGIN`       | Em produção | Endereço público do frontend, ex.: `https://portcalls.evolurelabs.com`. Aceita vários separados por vírgula; o primeiro é usado nos links de convite. Por omissão (desenvolvimento): `http://localhost:5173` |
| `NODE_ENV`         | Em produção | `production` (activa o cookie `Secure`)                                                                                                                                                                      |
| `TRUST_PROXY_HOPS` | Em produção | Número de proxies à frente do servidor. Com Vercel → Render são `2`. Por omissão: `1`                                                                                                                        |
| `SESSION_TTL_DAYS` |     Não     | Duração da sessão em dias (por omissão `7`)                                                                                                                                                                  |
| `PORT`             |     Não     | Porta do servidor (por omissão `3001`; o Render define a sua)                                                                                                                                                |

> Em desenvolvimento local, deixa `NODE_ENV` como `development`: o Safari não guarda cookies `Secure` em `http://localhost`.

---

## 🌍 Publicação

```
Navegador ──► Vercel (frontend + reencaminhamento de /api)
                     │
                     ▼
              Render (Express)  ──►  Neon (PostgreSQL)
                     │
                     └──►  Microsoft Graph  ──►  SharePoint
```

1. **Neon** — criar o projecto (região Europa) e copiar a `DATABASE_URL` directa.
2. **Tabelas e administrador** — a partir do teu PC, com o `DATABASE_URL` da Neon:
   ```bash
   cd server
   DATABASE_URL="postgresql://..." npx prisma db push
   DATABASE_URL="postgresql://..." npm run create-admin -- "Empresa" email@empresa.com "Nome"
   ```
3. **Render** — o ficheiro `render.yaml` na raiz define o serviço (pasta `server`, instalação com dependências de desenvolvimento, `npx prisma generate`, arranque com `npx tsx src/index.ts`, verificação em `/health`). Criar com **New → Blueprint** e colar o `DATABASE_URL` quando pedido. Confirmar `APP_ORIGIN`, `NODE_ENV=production` e `TRUST_PROXY_HOPS=2`.
4. **Vercel** — o `vercel.json` reencaminha `/api/*` para o serviço do Render (substituir o destino pelo endereço real) e mantém o fallback da SPA. Assim o navegador fala sempre com a mesma origem e o cookie funciona.

Teste rápido: `GET /health` no servidor devolve `{"status":"ok"}`.

---

## ☁️ Integração com SharePoint

O sistema suporta dois modos de armazenamento de documentos:

### Modo Local (Padrão)

- Só se guarda o **registo** do documento na base de dados (nome, tipo, tamanho)
- Sem upload real de ficheiros
- Útil para testes

### Modo SharePoint

- Ficheiros guardados no SharePoint da empresa
- Partilhados com todos os departamentos
- Integração via Microsoft Graph API
- Na base de dados ficam as referências (`driveId`, `itemId`, `webUrl`)

#### Configuração

> ⚠️ **Estado actual:** a configuração é guardada **no navegador** de quem a faz (`/app/settings`, só Admin), incluindo o Client Secret, e o upload é feito a partir do navegador. Por isso, por agora, **não uses um segredo de produção**; usa um site de teste e roda o segredo no fim. Passar esta configuração para o servidor (cifrada, por empresa) está nos próximos passos.

1. Aceda a **Configurações** (ícone ⚙️ no menu, visível para administradores)
2. Selecione **SharePoint** como modo de armazenamento
3. Preencha os dados:
   - **URL do Site SharePoint**: `https://empresa.sharepoint.com/sites/portos`
   - **Nome da Biblioteca**: `Documentos`
   - **Pasta Raiz**: `Processos`
   - **Tenant ID**: ID do directório (Microsoft Entra ID)
   - **Client ID**: ID da aplicação registada
   - **Client Secret**: o **valor** do segredo (aparece uma única vez ao criá-lo)
4. Clique em **Validar SharePoint** para testar

#### Estrutura de Pastas no SharePoint

```
SharePoint
└── Documentos (Biblioteca)
    └── Processos (Pasta raiz configurável)
        ├── PC-2026-001 (ID do processo)
        │   ├── Contrato.pdf
        │   └── Fatura.pdf
        │
        └── PC-2026-002
            ├── Licenca.pdf
            └── Relatorio.pdf
```

#### Permissões Microsoft Graph

A aplicação registada no Microsoft Entra ID precisa de permissões de **aplicação** (não delegadas), com **Grant admin consent**:

- `Sites.ReadWrite.All` — Acesso ao site SharePoint
- `Files.ReadWrite.All` — Leitura e escrita de ficheiros

> Para limitar o acesso a um único site, prefere `Sites.Selected` e concede à aplicação acesso a esse site pelo Graph. É mais fácil de aprovar pela TI da empresa.

#### Como Obter Credenciais

1. Aceda ao [Azure Portal](https://portal.azure.com)
2. Vá a **Microsoft Entra ID** → **App registrations** → **New registration**
3. Registe uma nova aplicação e copie o **Application (client) ID**
4. Em **Certificates & secrets**, crie um novo **Client secret** e copie o **Value** (não o Secret ID)
5. Em **API permissions**, adicione:
   - Microsoft Graph → **Application permissions**
   - `Sites.ReadWrite.All` e `Files.ReadWrite.All` (ou `Sites.Selected`)
6. Clique em **Grant admin consent**
7. Copie o **Tenant ID** da página **Overview**

#### Vantagens do Modo SharePoint

✅ **Partilha entre departamentos** — Operações, Financeiro, e outros acedem aos mesmos documentos  
✅ **Backup automático** — SharePoint faz backup nativo  
✅ **Controlo de versões** — Histórico de alterações dos documentos  
✅ **Segurança empresarial** — Autenticação Microsoft 365  
✅ **Sem duplicação** — Ficheiros guardados uma única vez

---

## 🚀 Estado das Funcionalidades

### ✅ Implementadas

- [x] Dashboard com 7 métricas
- [x] Tabela de operações com pesquisa e filtros
- [x] Criação de nova operação portuária
- [x] Ficha detalhada com 6 separadores
- [x] Gestão de autorizações (5 entidades)
- [x] Controlo de 10 marcos da escala
- [x] Gestão de faturas (recebidas/pendentes), com moeda por fatura
- [x] Upload de documentos para o SharePoint
- [x] Timeline de eventos com o nome real de cada utilizador
- [x] Cálculo automático de progresso (0-100%), feito no servidor
- [x] Contagem de pendências e alertas críticos (≥5 pendências ou ETD < 48h)
- [x] Auto-registo de ATA/ATD ao confirmar marcos
- [x] Edição de dados e encerramento de operações
- [x] Persistência em PostgreSQL (Neon) através da API
- [x] Autenticação com sessões em cookie
- [x] Multi-empresa com isolamento de dados
- [x] Papéis e permissões (Admin, Coordenador, Gestor, Financeiro)
- [x] Convites por link e gestão da equipa
- [x] Demonstração só de leitura em `/demo`
- [x] Design responsivo

### 🔄 Próximos Passos

- [ ] Alterar a palavra-passe (com sessão iniciada)
- [ ] Recuperar a palavra-passe e notificações por e-mail
- [ ] Configuração do SharePoint e upload feitos no servidor (segredo cifrado por empresa)
- [ ] Validar o encerramento no servidor (hoje, quem impede é só o frontend)
- [ ] Limpar o `/app/settings` (o bloco da base de dados já não se aplica)
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Sincronização bidirecional com SharePoint (ler ficheiros existentes)
- [ ] Webhooks para notificações em tempo real
- [ ] Migrações do Prisma (hoje usa-se `db push`) antes da primeira alteração ao schema com dados reais
- [ ] Mais de uma empresa por utilizador
- [ ] Testes automáticos no repositório

---

## 📊 Modelo de Dados

### PortProcess (como chega ao frontend)

```typescript
{
  id: string;
  fileNumber: string;          // Nº do ficheiro (único por empresa)
  srfNumber: string;           // Referência interna (único por empresa)
  vesselName: string;          // Nome do navio
  imo: string | null;          // Número IMO
  client: string;              // Cliente/Principal
  port: string;                // Porto
  terminal: string | null;     // Terminal
  eta: string | null;          // Estimated Time of Arrival (ISO)
  ata: string | null;          // Actual Time of Arrival
  etd: string | null;          // Estimated Time of Departure
  atd: string | null;          // Actual Time of Departure
  coordinator: string;         // Nome de quem criou a operação
  status: 'OPEN' | 'CLOSED';
  observations: string | null;
  progress: number;            // 0-100, calculado no servidor
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;

  authorizations: Authorization[];
  milestones: Milestone[];
  invoices: Invoice[];         // com currency: 'MZN' | 'USD' | 'EUR'
  files: ProcessFile[];
  events: TimelineEvent[];     // user: nome de quem fez a ação
}
```

### Entidades principais (PostgreSQL)

```
Organization ─┬─ Membership (papel) ─── User ─── Session
              ├─ Invitation
              └─ Process ─┬─ Authorization
                          ├─ Milestone
                          ├─ Invoice
                          ├─ File
                          └─ TimelineEvent
```

- Os processos usam **apagamento lógico** (`deletedAt`); as faturas, ficheiros e eventos não são apagados em cascata
- O progresso calcula-se como (autorizações tratadas + marcos confirmados + faturas recebidas + estado fechado) / (total de itens + 1)

---

## 🔄 Fluxo de Trabalho

```
1. ABERTURA
   └─→ Registo do pedido e criação do ficheiro

2. NOTIFICAÇÃO
   └─→ Comunicação às autoridades portuárias

3. CHEGADA E OPERAÇÕES
   └─→ Registo de ATA, realização de serviço, registo de ATD

4. RECOLHA DE FATURAS
   └─→ Recebimento de documentos de todas as entidades

5. HANDOVER FINANCEIRO
   └─→ Entrega à contabilidade para faturação ao cliente

6. ENCERRAMENTO
   └─→ Fecho do ficheiro após todas as pendências resolvidas
```

---

## 🔌 API

Todas as rotas `/api` (exceto as públicas de autenticação) exigem sessão. Os erros vêm como `{ "error": "mensagem" }`.

| Método | Rota                                  | Permissão                      | Descrição                                                  |
| ------ | ------------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| GET    | `/health`                             | Pública                        | Estado do servidor                                         |
| POST   | `/api/auth/login`                     | Pública                        | Iniciar sessão                                             |
| POST   | `/api/auth/logout`                    | Pública                        | Terminar sessão                                            |
| GET    | `/api/auth/me`                        | Sessão                         | Utilizador, empresa e papel actuais                        |
| GET    | `/api/auth/invitations/:token`        | Pública                        | Dados de um convite válido                                 |
| POST   | `/api/auth/invitations/:token/accept` | Pública                        | Criar conta a partir do convite                            |
| GET    | `/api/processes`                      | Sessão                         | Listar operações                                           |
| GET    | `/api/processes/:id`                  | Sessão                         | Obter uma operação                                         |
| POST   | `/api/processes`                      | Admin, Coordenador             | Criar operação (com autorizações, marcos e faturas padrão) |
| PATCH  | `/api/processes/:id`                  | Admin, Coordenador             | Atualizar dados da operação                                |
| POST   | `/api/processes/:id/close`            | Admin, Coordenador             | Encerrar                                                   |
| POST   | `/api/processes/:id/files`            | Admin, Coordenador             | Registar um documento                                      |
| PATCH  | `/api/authorizations/:id`             | Admin, Coordenador             | Alterar o estado de uma autorização                        |
| PATCH  | `/api/milestones/:id`                 | Admin, Coordenador             | Confirmar ou desmarcar um marco                            |
| PATCH  | `/api/invoices/:id`                   | Admin, Coordenador, Financeiro | Atualizar uma fatura                                       |
| DELETE | `/api/files/:id`                      | Admin, Coordenador             | Remover o registo de um documento                          |
| GET    | `/api/stats`                          | Sessão                         | Estatísticas do painel                                     |
| GET    | `/api/team/members`                   | Admin                          | Listar membros                                             |
| PATCH  | `/api/team/members/:userId`           | Admin                          | Mudar o papel ou desativar/reativar                        |
| GET    | `/api/team/invitations`               | Admin                          | Listar convites pendentes                                  |
| POST   | `/api/team/invitations`               | Admin                          | Criar convite (devolve o link uma vez)                     |
| DELETE | `/api/team/invitations/:id`           | Admin                          | Revogar convite                                            |

As alterações a autorizações, marcos e faturas devolvem a operação completa, já com o progresso e o histórico atualizados.

---

## 📝 Notas de Desenvolvimento

### Persistência de Dados

#### 1. Base de Dados (PostgreSQL) — Metadados

- Processos, autorizações, marcos, faturas, referências a ficheiros, timeline, utilizadores e sessões
- Vantagens: vários utilizadores e dispositivos, dados centralizados e isolados por empresa

#### 2. SharePoint — Ficheiros Físicos

- Os ficheiros físicos ficam no SharePoint da empresa
- A aplicação guarda apenas **referências** (`driveId`, `itemId`, `webUrl`) no PostgreSQL

#### 3. localStorage — só a demonstração

- O `/demo` usa dados fictícios guardados no navegador (`store.ts`). A área com sessão **não** lê do localStorage

### Estrutura do Projeto

```
portcalls-mvp/
│
├── src/                          # Frontend (React/Vite)
│   ├── components/
│   │   ├── DashboardView.tsx     # Tabela e métricas do painel (partilhada com a demo)
│   │   ├── layout/
│   │   │   ├── PublicLayout.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── ui/                   # Button, Card, Input, Textarea, Modal, StatusBadge
│   ├── lib/
│   │   ├── api.ts                # Cliente da API (cookie de sessão, erros, tradução de formatos)
│   │   ├── data.ts               # Operações de dados da área com sessão (usa api.ts)
│   │   ├── auth.tsx              # AuthProvider e useAuth
│   │   ├── roles.ts              # Papéis e descrições
│   │   ├── permissions.ts        # O que cada papel vê (só interface)
│   │   ├── processUtils.ts       # Pendências, criticidade e filtros
│   │   ├── routes.ts             # Caminhos da aplicação
│   │   ├── contact.ts            # Contacto de demonstração (WhatsApp)
│   │   ├── store.ts              # localStorage — só para /demo
│   │   ├── types.ts              # Tipos TypeScript
│   │   ├── validations.ts        # Validações de formulários e ficheiros
│   │   ├── config.ts             # Configuração do SharePoint
│   │   ├── sharepoint.ts         # Serviço Microsoft Graph API
│   │   └── sharepoint-types.ts   # Tipos SharePoint
│   ├── pages/
│   │   ├── Landing.tsx           # Página de apresentação
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── AcceptInvite.tsx  # Aceitar convite
│   │   ├── Dashboard.tsx         # Painel de operações
│   │   ├── Demo.tsx              # Demonstração só de leitura
│   │   ├── NewProcess.tsx        # Criar nova operação
│   │   ├── ProcessDetails.tsx    # Detalhes da operação
│   │   ├── Team.tsx              # Equipa e convites
│   │   └── Setup.tsx             # Configuração (SharePoint)
│   ├── App.tsx                   # Rotas
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Estilos globais
│
├── server/                       # Backend (Express + Prisma)
│   ├── src/
│   │   ├── index.ts              # Arranque e montagem das rotas
│   │   ├── routes/
│   │   │   ├── auth.ts           # Login, logout, /me e aceitar convites
│   │   │   ├── processes.ts      # Operações
│   │   │   ├── items.ts          # Autorizações, marcos, faturas e ficheiros
│   │   │   ├── stats.ts          # Estatísticas
│   │   │   └── team.ts           # Equipa e convites (Admin)
│   │   ├── middleware/
│   │   │   ├── requireAuth.ts    # Exige sessão e anexa utilizador/empresa/papel
│   │   │   ├── requireRole.ts    # Restringe por papel
│   │   │   └── originCheck.ts    # Verifica o Origin nos pedidos que alteram dados
│   │   └── lib/
│   │       ├── prisma.ts
│   │       ├── http.ts           # Erros, validação e tratamento central
│   │       ├── passwords.ts      # argon2id
│   │       ├── sessions.ts       # Criar, ler e terminar sessões
│   │       ├── tokens.ts         # Geração e hash de tokens
│   │       ├── permissions.ts    # Permissões por papel
│   │       └── processes.ts      # Include, serialização, progresso e modelos padrão
│   ├── scripts/
│   │   └── create-admin.ts       # Cria a primeira empresa e o administrador
│   ├── prisma/
│   │   └── schema.prisma         # Schema PostgreSQL
│   ├── .env.example              # Template de configuração
│   └── package.json
│
├── render.yaml                   # Serviço do Render
├── vercel.json                   # Reencaminhamento de /api e fallback da SPA
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🐛 Problemas Conhecidos

1. **Plano gratuito do Render** — o serviço adormece após ~15 minutos sem tráfego e o primeiro pedido seguinte demora cerca de um minuto. Um monitor a chamar `/health` de 5 em 5 minutos evita-o; para uso a sério, usar um plano pago.
2. **Plano gratuito da Neon** — 0,5 GB por projecto, a base adormece após inactividade e a janela de recuperação é curta (horas). Fazer `pg_dump` regulares guardados fora da Neon.
3. **SharePoint configurado no navegador** — o Client Secret fica no navegador de quem configura e o upload sai do cliente. Não usar segredos de produção até isto passar para o servidor.
4. **Modo Local: ficheiros não são guardados** — apenas o registo do documento.
5. **Sem alterar nem recuperar a palavra-passe** — a palavra-passe inicial vem do `create-admin` ou do convite.
6. **Uma empresa por utilizador** — convidar um e-mail que já tem conta noutra empresa não é possível.
7. **Encerramento sem validação no servidor** — o frontend impede encerrar com pendências, mas a API aceita o pedido.
8. **Números de ficheiro/SRF gerados aleatoriamente** quando não indicados — numa colisão (rara) a API devolve 409 e basta repetir.
9. **CORS no SharePoint** — pode ser necessário configurar CORS no SharePoint para permitir chamadas da aplicação.
10. **Token do Graph em memória** — o token de acesso ao SharePoint perde-se ao recarregar a página.
11. **Uso comercial dos planos gratuitos** — o plano Hobby da Vercel é para uso pessoal não comercial; rever os planos antes de uma utilização comercial.

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 👤 Autor

**Arcides Ferrão**  
[@ArcidesFerrao](https://github.com/ArcidesFerrao)

---

## 🙏 Agradecimentos

Desenvolvido com base nas necessidades operacionais de gestão portuária em Moçambique.

---

<div align="center">

**PortOps** — Gestão de Operações Portuárias

_Construído com React + TypeScript + Tailwind CSS, Express + Prisma e PostgreSQL_

</div>
