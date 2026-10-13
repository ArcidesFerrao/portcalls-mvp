# 🚢 PortOps — Sistema de Gestão de Operações Portuárias

Sistema web para registo, acompanhamento e encerramento de operações portuárias, desde o agendamento até à partida do navio, com controlo completo de documentos, autorizações, faturas e prazos.

---

## 📋 Propósito

Registar, acompanhar e fechar operações de navios em portos, garantindo o controlo de:

- ✅ Documentos e autorizações legais
- ✅ Faturas de fornecedores e entidades
- ✅ Marcos da escala (agendamento, chegada, operações, partida)
- ✅ Prazos e pendências
- ✅ Handover financeiro e encerramento

---

## 🏗️ Arquitetura

### Nível 1 — Painel de Visão Global (Dashboard)

Lista todas as operações com métricas em tempo real:

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
- Nome do navio (IMO)
- Barra de progresso visual (0-100%)
- Cliente/Principal
- Porto e Terminal
- Datas ATA/ATD (ou ETA se ainda não chegou)
- Coordenador de operações
- Estado (Aberto/Fechado)
- Contagem de itens pendentes

### Nível 2 — Ficha Detalhada (Processo Individual)

Ao aceder a uma operação, o sistema apresenta 6 separadores:

#### 1. **Geral**

- Dados completos do navio, cliente, porto, terminal
- Datas ETA/ATA/ETD/ATD
- Coordenador e observações
- Edição inline de todos os campos

#### 2. **Autorizações**

Tabela com as entidades portuárias:

- Saúde Portuária
- Alfândega
- Imigração
- Polícia Marítima
- Intransmar

Cada autorização pode estar: **Recebida** | **Não Aplicável** | **Pendente**

#### 3. **Marcos da Escala**

10 etapas cronológicas com toggle de confirmação:

1. Receção do Pedido
2. Agendamento
3. Notificação Autoridades
4. Chegada do Navio (ATA) — _auto-regista ATA_
5. Início de Operações
6. Fim de Operações
7. Partida do Navio (ATD) — _auto-regista ATD_
8. Recolha de Faturas
9. Handover Financeiro
10. Encerramento

#### 4. **Faturas**

- **Secção "Em Falta"** (destaque âmbar): Faturas ainda não recebidas
- **Secção "Recebidas"**: Faturas com referência e valor
- Possibilidade de marcar como recebida com referência e montante

#### 5. **Documentos**

- Upload de ficheiros (PDF, imagens, documentos)
- Visualização e remoção
- Validação de tamanho (máx. 10MB) e tipo

#### 6. **Histórico**

Timeline cronológica de todos os eventos:

- Criação do ficheiro
- Atualizações de autorizações
- Confirmação de marcos
- Receção de faturas
- Encerramento da operação

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
Frontend:
├── React 18
├── TypeScript
├── Vite
├── Tailwind CSS v4
├── React Router DOM
├── Lucide React (ícones)
├── date-fns (formatação de datas)
└── uuid (geração de IDs únicos)

Backend (server/):
├── Node.js
├── Express.js
├── TypeScript
├── Prisma ORM
└── PostgreSQL

Storage:
├── PostgreSQL (metadados e referências)
└── SharePoint (ficheiros físicos via Microsoft Graph API)
```

---

## 📦 Instalação

```bash
# Clonar o repositório
git clone https://github.com/ArcidesFerrao/portcalls-mvp.git
cd portcalls-mvp

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## ☁️ Integração com SharePoint

O sistema suporta dois modos de armazenamento de documentos:

### Modo Local (Padrão)

- Apenas metadados são guardados no localStorage
- Sem upload real de ficheiros
- Ideal para testes e demonstração

### Modo SharePoint

- Ficheiros guardados no SharePoint da empresa
- Partilhados com todos os departamentos
- Integração via Microsoft Graph API

#### Configuração

1. Aceda à página **Configurações** (ícone ⚙️ no menu)
2. Selecione **SharePoint** como modo de armazenamento
3. Preencha os dados:
   - **URL do Site SharePoint**: `https://empresa.sharepoint.com/sites/portos`
   - **Nome da Biblioteca**: `Documentos`
   - **Pasta Raiz**: `Processos`
   - **Tenant ID**: ID do Azure AD
   - **Client ID**: ID da aplicação registada
   - **Client Secret**: Secret da aplicação

4. Clique em **Validar Conexão** para testar
5. Se válido, clique em **Guardar Configuração**

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

A aplicação registada no Azure AD precisa das seguintes permissões:

- `Sites.ReadWrite.All` — Acesso ao site SharePoint
- `Files.ReadWrite.All` — Leitura e escrita de ficheiros

#### Como Obter Credenciais

1. Aceda ao [Azure Portal](https://portal.azure.com)
2. Vá a **Azure Active Directory** → **App registrations** → **New registration**
3. Registe uma nova aplicação e copie o **Application (client) ID**
4. Em **Certificates & secrets**, crie um novo **Client secret**
5. Em **API permissions**, adicione:
   - Microsoft Graph → Application permissions
   - `Sites.ReadWrite.All`
   - `Files.ReadWrite.All`
6. Clique em **Grant admin consent**
7. Copie o **Tenant ID** da página **Overview** do Azure AD

#### Vantagens do Modo SharePoint

✅ **Partilha entre departamentos** — Operações, Financeiro, e outros acedem aos mesmos documentos  
✅ **Backup automático** — SharePoint faz backup nativo  
✅ **Controlo de versões** — Histórico de alterações dos documentos  
✅ **Segurança empresarial** — Autenticação Microsoft 365  
✅ **Sem duplicação** — Ficheiros guardados uma única vez  
✅ **Acesso offline** — SharePoint suporta sincronização offline

---

## 🚀 Funcionalidades

### ✅ Implementadas

- [x] Dashboard com 7 métricas em tempo real
- [x] Tabela de operações com pesquisa e filtros
- [x] Criação de nova operação portuária
- [x] Ficha detalhada com 6 separadores
- [x] Gestão de autorizações (5 entidades)
- [x] Controlo de 10 marcos da escala
- [x] Gestão de faturas (recebidas/pendentes)
- [x] Upload de documentos
- [x] Timeline de eventos
- [x] Cálculo automático de progresso (0-100%)
- [x] Contagem de pendências
- [x] Alertas críticos (≥5 pendências ou ETD < 48h)
- [x] Auto-marcação ATA/ATD ao confirmar marcos
- [x] Edição inline de dados
- [x] Encerramento de operações
- [x] Dados demo (5 operações em diferentes fases)
- [x] Design responsivo
- [x] Persistência em localStorage

### 🔄 Próximas Funcionalidades

- [x] ~~Integração com SharePoint via Microsoft Graph API~~ ✅
- [ ] Integração com base de dados cloud (PostgreSQL/Supabase)
- [ ] Autenticação e autorização de utilizadores
- [ ] Multi-utilizador com roles (Coordenador, Gestor, Financeiro)
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Notificações por email
- [ ] API REST para integração com outros sistemas
- [ ] Sincronização bidirecional com SharePoint (ler ficheiros existentes)
- [ ] Webhooks para notificações em tempo real

---

## 📊 Modelo de Dados

### PortProcess

```typescript
{
  id: string;
  fileNumber: string;          // Nº do ficheiro (ex: "309722")
  srfNumber: string;           // Referência interna (ex: "SRF-2024-1234")
  vesselName: string;          // Nome do navio
  imo: string;                 // Número IMO
  client: string;              // Cliente/Principal
  port: string;                // Porto
  terminal: string;            // Terminal
  eta: string | null;          // Estimated Time of Arrival
  ata: string | null;          // Actual Time of Arrival
  etd: string | null;          // Estimated Time of Departure
  atd: string | null;          // Actual Time of Departure
  coordinator: string;         // Coordenador de operações
  status: 'OPEN' | 'CLOSED';
  observations: string | null;
  progress: number;            // 0-100
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;

  authorizations: Authorization[];
  milestones: Milestone[];
  invoices: Invoice[];
  files: ProcessFile[];
  events: TimelineEvent[];
}
```

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

## 👥 Utilizadores-Tipo

| Perfil                       | Responsabilidades                      |
| ---------------------------- | -------------------------------------- |
| **Coordenador de Operações** | Atualiza dados, etapas e estados       |
| **Gestor de Ficheiros**      | Supervisiona progresso e pendências    |
| **Financeiro**               | Consulta faturas recebidas e a receber |

---

## 📝 Notas de Desenvolvimento

### Persistência de Dados

O sistema suporta **duas camadas de armazenamento**:

#### 1. Base de Dados (PostgreSQL) — Metadados

- **Todos os metadados** dos processos são guardados na base de dados PostgreSQL do cliente
- Processos, autorizações, marcos, faturas, referências a ficheiros, timeline
- **Vantagens:**
  - ✅ Múltiplos utilizadores/dispositivos
  - ✅ Dados centralizados e seguros
  - ✅ Backup e controlo total pelo cliente
  - ✅ Performance e escalabilidade

#### 2. SharePoint — Ficheiros Físicos

- **Ficheiros físicos** guardados no SharePoint da empresa
- A aplicação guarda apenas **referências** (driveId, itemId, webUrl) no PostgreSQL
- **Vantagens:**
  - ✅ Partilha entre departamentos
  - ✅ Backup automático (SharePoint)
  - ✅ Controlo de versões
  - ✅ Segurança empresarial
  - ✅ Sem duplicação de ficheiros

### Arquitetura de Integração

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
│   (server/)     │
└────────┬────────┘
         │
         ├─→ PostgreSQL (metadados)
         │   └─→ Referências SharePoint
         │
         └─→ Microsoft Graph API
              │
              └─→ SharePoint (ficheiros físicos)
```

### Instalação do Backend

```bash
# 1. Ir para a pasta do servidor
cd server

# 2. Instalar dependências
npm install

# 3. Configurar base de dados
cp .env.example .env
# Editar .env com DATABASE_URL

# 4. Criar base de dados
# No PostgreSQL: CREATE DATABASE portops;

# 5. Executar migrações
npm run db:generate
npm run db:push

# 6. Iniciar servidor
npm run dev
```

Ver [server/README.md](server/README.md) para documentação completa do backend.

### Próximos Passos

- [x] ~~Integração com PostgreSQL~~ ✅
- [x] ~~Integração com SharePoint~~ ✅
- [ ] Implementar sincronização bidirecional com SharePoint
- [ ] Adicionar sistema de autenticação multi-utilizador (JWT/OAuth2)
- [ ] Implementar webhooks para notificações em tempo real
- [ ] Adicionar sistema de roles e permissões

### Estrutura do Projeto

```
portcalls-mvp/
│
├── src/                       # Frontend (React/Vite)
│   ├── components/
│   │   └── ui/                # Componentes reutilizáveis
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Textarea.tsx
│   │       ├── Modal.tsx
│   │       └── StatusBadge.tsx
│   ├── lib/
│   │   ├── store.ts           # Gestão de estado (fallback localStorage)
│   │   ├── api.ts             # Cliente API (comunicação com backend)
│   │   ├── types.ts           # Tipos TypeScript
│   │   ├── validations.ts     # Validações de formulários
│   │   ├── config.ts          # Configuração do SharePoint
│   │   ├── sharepoint.ts      # Serviço Microsoft Graph API
│   │   └── sharepoint-types.ts # Tipos SharePoint
│   ├── pages/
│   │   ├── Dashboard.tsx      # Painel de operações
│   │   ├── NewProcess.tsx     # Criar nova operação
│   │   ├── ProcessDetails.tsx # Detalhes da operação
│   │   └── Setup.tsx          # Configuração (DB + SharePoint)
│   ├── App.tsx                # Router e layout
│   ├── main.tsx               # Entry point
│   └── index.css              # Estilos globais
│
├── server/                    # Backend (Express + Prisma)
│   ├── src/
│   │   └── index.ts           # Servidor Express + API REST
│   ├── prisma/
│   │   └── schema.prisma      # Schema PostgreSQL
│   ├── .env.example           # Template de configuração
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md              # Documentação do backend
│
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🐛 Problemas Conhecidos

1. **Modo Local: Ficheiros não são guardados fisicamente** — Apenas metadados são armazenados no localStorage
2. **Sem autenticação na aplicação** — Qualquer pessoa pode aceder e editar (SharePoint tem autenticação própria)
3. **Modo Local: Sem backup** — Dados podem ser perdidos ao limpar cache
4. **localStorage limitado** — Máximo ~5-10MB dependendo do navegador
5. **CORS no SharePoint** — Pode ser necessário configurar CORS no SharePoint para permitir chamadas da aplicação
6. **Token caching** — O token de acesso é guardado em memória (perdido ao recarregar a página)

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

_Construído com React + TypeScript + Tailwind CSS_

</div>
