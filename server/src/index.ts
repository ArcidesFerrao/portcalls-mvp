import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { originCheck } from "./middleware/originCheck";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());
app.use("/api", originCheck);
app.use("/api/auth", authRouter);
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ PROCESSES ============

// GET /api/processes - Listar todos os processos
app.get('/api/processes', async (req, res) => {
  try {
    const processes = await prisma.process.findMany({
      include: {
        authorizations: true,
        milestones: { orderBy: { order: 'asc' } },
        invoices: true,
        files: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(processes);
  } catch (error) {
    console.error('Error fetching processes:', error);
    res.status(500).json({ error: 'Failed to fetch processes' });
  }
});

// GET /api/processes/:id - Obter processo por ID
app.get('/api/processes/:id', async (req, res) => {
  try {
    const process = await prisma.process.findUnique({
      where: { id: req.params.id },
      include: {
        authorizations: true,
        milestones: { orderBy: { order: 'asc' } },
        invoices: true,
        files: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });
    
    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }
    
    res.json(process);
  } catch (error) {
    console.error('Error fetching process:', error);
    res.status(500).json({ error: 'Failed to fetch process' });
  }
});

// POST /api/processes - Criar novo processo
app.post('/api/processes', async (req, res) => {
  try {
    const {
      fileNumber,
      srfNumber,
      vesselName,
      imo,
      client,
      port,
      terminal,
      eta,
      etd,
      coordinator,
      observations,
    } = req.body;

    // Gerar fileNumber e srfNumber se não fornecidos
    const finalFileNumber = fileNumber || String(Math.floor(300000 + Math.random() * 99999));
    const finalSrfNumber = srfNumber || `SRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`;

    const process = await prisma.process.create({
      data: {
        fileNumber: finalFileNumber,
        srfNumber: finalSrfNumber,
        vesselName,
        imo: imo || null,
        client,
        port,
        terminal: terminal || null,
        eta: eta ? new Date(eta) : null,
        etd: etd ? new Date(etd) : null,
        coordinator,
        observations: observations || null,
        status: 'OPEN',
        progress: 0,
      },
    });

    // Criar autorizações padrão
    const defaultAuthorizations = [
      { entity: 'Saúde Portuária', reason: 'Inspeção sanitária do navio' },
      { entity: 'Alfândega', reason: 'Declaração de carga e manifesto' },
      { entity: 'Imigração', reason: 'Controlo de tripulação' },
      { entity: 'Polícia Marítima', reason: 'Segurança portuária' },
      { entity: 'Intransmar', reason: 'Agência marítima' },
    ];

    for (const auth of defaultAuthorizations) {
      await prisma.authorization.create({
        data: {
          processId: process.id,
          entity: auth.entity,
          reason: auth.reason,
          status: 'PENDING',
        },
      });
    }

    // Criar marcos padrão
    const defaultMilestones = [
      { name: 'Receção do Pedido', description: 'Pedido recebido do cliente', order: 1 },
      { name: 'Agendamento', description: 'Escala agendada com o porto', order: 2 },
      { name: 'Notificação Autoridades', description: 'Comunicação às entidades portuárias', order: 3 },
      { name: 'Chegada do Navio (ATA)', description: 'Navio atracado no terminal', order: 4 },
      { name: 'Início de Operações', description: 'Operações de carga/descarga iniciadas', order: 5 },
      { name: 'Fim de Operações', description: 'Operações concluídas', order: 6 },
      { name: 'Partida do Navio (ATD)', description: 'Navio deixou o porto', order: 7 },
      { name: 'Recolha de Faturas', description: 'Todas as faturas recebidas', order: 8 },
      { name: 'Handover Financeiro', description: 'Entregue à contabilidade', order: 9 },
      { name: 'Encerramento', description: 'Ficheiro encerrado', order: 10 },
    ];

    for (const ms of defaultMilestones) {
      await prisma.milestone.create({
        data: {
          processId: process.id,
          name: ms.name,
          description: ms.description,
          order: ms.order,
          confirmed: false,
        },
      });
    }

    // Criar faturas padrão
    const defaultInvoices = [
      { entity: 'PBT', description: 'Port Charges — Taxas Portuárias' },
      { entity: 'Terminal', description: 'Taxas de Terminal — Movimentação' },
      { entity: 'Rebocadores', description: 'Serviço de Rebocagem' },
      { entity: 'Praticagem', description: 'Serviço de Praticagem' },
      { entity: 'Amarradores', description: 'Serviço de Amarração' },
      { entity: 'Agência', description: 'Taxas de Agência Marítima' },
    ];

    for (const inv of defaultInvoices) {
      await prisma.invoice.create({
        data: {
          processId: process.id,
          entity: inv.entity,
          description: inv.description,
          status: 'AWAITING',
        },
      });
    }

    // Criar evento inicial
    await prisma.timelineEvent.create({
      data: {
        processId: process.id,
        action: 'Ficheiro Criado',
        description: `Operação registada para ${vesselName}`,
        user: 'Sistema',
      },
    });

    // Retornar processo completo
    const fullProcess = await prisma.process.findUnique({
      where: { id: process.id },
      include: {
        authorizations: true,
        milestones: { orderBy: { order: 'asc' } },
        invoices: true,
        files: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    res.status(201).json(fullProcess);
  } catch (error) {
    console.error('Error creating process:', error);
    res.status(500).json({ error: 'Failed to create process' });
  }
});

// PATCH /api/processes/:id - Atualizar processo
app.patch('/api/processes/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // Converter datas
    if (updates.eta) updates.eta = new Date(updates.eta);
    if (updates.ata) updates.ata = new Date(updates.ata);
    if (updates.etd) updates.etd = new Date(updates.etd);
    if (updates.atd) updates.atd = new Date(updates.atd);

    const process = await prisma.process.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        authorizations: true,
        milestones: { orderBy: { order: 'asc' } },
        invoices: true,
        files: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    res.json(process);
  } catch (error) {
    console.error('Error updating process:', error);
    res.status(500).json({ error: 'Failed to update process' });
  }
});

// POST /api/processes/:id/close - Encerrar processo
app.post('/api/processes/:id/close', async (req, res) => {
  try {
    const process = await prisma.process.update({
      where: { id: req.params.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        progress: 100,
      },
      include: {
        authorizations: true,
        milestones: { orderBy: { order: 'asc' } },
        invoices: true,
        files: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    // Adicionar evento de encerramento
    await prisma.timelineEvent.create({
      data: {
        processId: process.id,
        action: 'Ficheiro Encerrado',
        description: 'Operação encerrada — todas as pendências resolvidas',
        user: 'Coordenador',
      },
    });

    res.json(process);
  } catch (error) {
    console.error('Error closing process:', error);
    res.status(500).json({ error: 'Failed to close process' });
  }
});

// ============ AUTHORIZATIONS ============

// PATCH /api/authorizations/:id - Atualizar autorização
app.patch('/api/authorizations/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    const auth = await prisma.authorization.update({
      where: { id: req.params.id },
      data: {
        status,
        receivedAt: status === 'RECEIVED' ? new Date() : null,
      },
    });

    // Adicionar evento
    const process = await prisma.process.findUnique({
      where: { id: auth.processId },
      include: { authorizations: true },
    });

    const authEntity = process?.authorizations.find(a => a.id === auth.id);
    
    await prisma.timelineEvent.create({
      data: {
        processId: auth.processId,
        action: 'Autorização Atualizada',
        description: `${authEntity?.entity}: ${status === 'RECEIVED' ? 'Recebida' : status === 'NOT_APPLICABLE' ? 'Não Aplicável' : 'Pendente'}`,
        user: 'Coordenador',
      },
    });

    res.json(auth);
  } catch (error) {
    console.error('Error updating authorization:', error);
    res.status(500).json({ error: 'Failed to update authorization' });
  }
});

// ============ MILESTONES ============

// PATCH /api/milestones/:id - Atualizar marco
app.patch('/api/milestones/:id', async (req, res) => {
  try {
    const { confirmed, date } = req.body;
    
    const milestone = await prisma.milestone.update({
      where: { id: req.params.id },
      data: {
        confirmed,
        date: date ? new Date(date) : confirmed ? new Date() : null,
      },
    });

    // Atualizar ATA/ATD automaticamente
    if (milestone.name.includes('ATA') && confirmed) {
      await prisma.process.update({
        where: { id: milestone.processId },
        data: { ata: milestone.date },
      });
    }
    if (milestone.name.includes('ATD') && confirmed) {
      await prisma.process.update({
        where: { id: milestone.processId },
        data: { atd: milestone.date },
      });
    }

    // Adicionar evento
    await prisma.timelineEvent.create({
      data: {
        processId: milestone.processId,
        action: confirmed ? 'Marco Confirmado' : 'Marco Desmarcado',
        description: milestone.name,
        user: 'Coordenador',
      },
    });

    res.json(milestone);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// ============ INVOICES ============

// PATCH /api/invoices/:id - Atualizar fatura
app.patch('/api/invoices/:id', async (req, res) => {
  try {
    const { status, reference, amount } = req.body;
    
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        status,
        reference: reference || null,
        amount: amount ? parseFloat(amount) : null,
        receivedAt: status === 'RECEIVED' ? new Date() : null,
      },
    });

    // Adicionar evento
    await prisma.timelineEvent.create({
      data: {
        processId: invoice.processId,
        action: 'Fatura Atualizada',
        description: `${invoice.entity} — ${status === 'RECEIVED' ? 'Recebida' : 'A receber'}`,
        user: 'Financeiro',
      },
    });

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// ============ FILES ============

// POST /api/processes/:id/files - Adicionar ficheiro
app.post('/api/processes/:id/files', async (req, res) => {
  try {
    const file = await prisma.file.create({
      data: {
        processId: req.params.id,
        ...req.body,
      },
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('Error adding file:', error);
    res.status(500).json({ error: 'Failed to add file' });
  }
});

// DELETE /api/files/:id - Remover ficheiro
app.delete('/api/files/:id', async (req, res) => {
  try {
    await prisma.file.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ============ STATS ============

// GET /api/stats - Estatísticas
app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const [total, open, closed, awaitingArrival, awaitingDeparture] = await Promise.all([
      prisma.process.count(),
      prisma.process.count({ where: { status: 'OPEN' } }),
      prisma.process.count({ where: { status: 'CLOSED' } }),
      prisma.process.count({ where: { status: 'OPEN', ata: null } }),
      prisma.process.count({ where: { status: 'OPEN', ata: { not: null }, atd: null } }),
    ]);

    const invoices = await prisma.invoice.findMany();
    const invoicesReceived = invoices.filter(i => i.status === 'RECEIVED').length;
    const invoicesAwaiting = invoices.filter(i => i.status === 'AWAITING').length;

    // Contar processos críticos
    const openProcesses = await prisma.process.findMany({
      where: { status: 'OPEN' },
      include: {
        authorizations: true,
        milestones: true,
        invoices: true,
      },
    });

    let critical = 0;
    for (const p of openProcesses) {
      const pendingAuths = p.authorizations.filter(a => a.status === 'PENDING').length;
      const pendingMilestones = p.milestones.filter(m => !m.confirmed).length;
      const pendingInvoices = p.invoices.filter(i => i.status === 'AWAITING').length;
      const totalPending = pendingAuths + pendingMilestones + pendingInvoices;
      
      if (totalPending >= 5 || (p.etd && p.etd < fortyEightHoursFromNow)) {
        critical++;
      }
    }

    res.json({
      total,
      open,
      closed,
      awaitingArrival,
      awaitingDeparture,
      invoicesReceived,
      invoicesAwaiting,
      critical,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PortOps API server running on http://localhost:${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
