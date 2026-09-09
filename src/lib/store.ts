import { v4 as uuidv4 } from 'uuid';
import { 
  PortProcess, ProcessStats, Authorization, Milestone, 
  Invoice, ProcessFile, TimelineEvent, ProcessStatus,
  AuthorizationStatus, InvoiceStatus
} from './types';

const PROCESSES_KEY = 'port_processes_db';

function getProcesses(): PortProcess[] {
  const data = localStorage.getItem(PROCESSES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveProcesses(processes: PortProcess[]): void {
  localStorage.setItem(PROCESSES_KEY, JSON.stringify(processes));
}

function generateFileNumber(): string {
  const num = Math.floor(300000 + Math.random() * 99999);
  return num.toString();
}

function generateSRF(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 8999);
  return `SRF-${year}-${seq}`;
}

// Stats
export function getStats(): ProcessStats {
  const processes = getProcesses();
  const now = new Date();
  
  let invoicesReceived = 0;
  let invoicesAwaiting = 0;
  let critical = 0;

  processes.forEach(p => {
    p.invoices.forEach(inv => {
      if (inv.status === 'RECEIVED') invoicesReceived++;
      else invoicesAwaiting++;
    });
    
    // Critical: open process with >5 pending items or ETD < 48h
    const pendingInvoices = p.invoices.filter(i => i.status === 'AWAITING').length;
    const pendingAuths = p.authorizations.filter(a => a.status === 'PENDING').length;
    const pendingMilestones = p.milestones.filter(m => !m.confirmed).length;
    const totalPending = pendingInvoices + pendingAuths + pendingMilestones;
    
    if (p.status === 'OPEN' && (totalPending >= 5 || (p.etd && new Date(p.etd) < new Date(now.getTime() + 48 * 60 * 60 * 1000)))) {
      critical++;
    }
  });

  return {
    total: processes.length,
    open: processes.filter(p => p.status === 'OPEN').length,
    closed: processes.filter(p => p.status === 'CLOSED').length,
    awaitingArrival: processes.filter(p => p.status === 'OPEN' && !p.ata).length,
    awaitingDeparture: processes.filter(p => p.status === 'OPEN' && p.ata && !p.atd).length,
    invoicesReceived,
    invoicesAwaiting,
    critical,
  };
}

// Get all processes
export function getAllProcesses(): PortProcess[] {
  return getProcesses().sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Get process by ID
export function getProcessById(id: string): PortProcess | null {
  return getProcesses().find(p => p.id === id) || null;
}

// Calculate progress
function calculateProgress(process: Omit<PortProcess, 'progress'>): number {
  let total = 0;
  let completed = 0;

  // Authorizations (weight: 25%)
  const authTotal = process.authorizations.length;
  const authDone = process.authorizations.filter(a => a.status !== 'PENDING').length;
  total += authTotal;
  completed += authDone;

  // Milestones (weight: 35%)
  const msTotal = process.milestones.length;
  const msDone = process.milestones.filter(m => m.confirmed).length;
  total += msTotal;
  completed += msDone;

  // Invoices (weight: 30%)
  const invTotal = process.invoices.length;
  const invDone = process.invoices.filter(i => i.status === 'RECEIVED').length;
  total += invTotal;
  completed += invDone;

  // Status (weight: 10%)
  total += 1;
  if (process.status === 'CLOSED') completed += 1;

  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Create default authorizations
function createDefaultAuthorizations(processId: string): Authorization[] {
  const entities = [
    { entity: 'Saúde Portuária', reason: 'Inspeção sanitária do navio' },
    { entity: 'Alfândega', reason: 'Declaração de carga e manifesto' },
    { entity: 'Imigração', reason: 'Controlo de tripulação' },
    { entity: 'Polícia Marítima', reason: 'Segurança portuária' },
    { entity: 'Intransmar', reason: 'Agência marítima' },
  ];

  return entities.map(e => ({
    id: uuidv4(),
    processId,
    entity: e.entity,
    reason: e.reason,
    status: 'PENDING' as AuthorizationStatus,
    receivedAt: null,
  }));
}

// Create default milestones
function createDefaultMilestones(processId: string): Milestone[] {
  const milestones = [
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

  return milestones.map(m => ({
    id: uuidv4(),
    processId,
    name: m.name,
    description: m.description,
    date: null,
    confirmed: false,
    order: m.order,
  }));
}

// Create default invoices
function createDefaultInvoices(processId: string): Invoice[] {
  const invoices = [
    { entity: 'PBT', description: 'Port Charges — Taxas Portuárias' },
    { entity: 'Terminal', description: 'Taxas de Terminal — Movimentação' },
    { entity: 'Rebocadores', description: 'Serviço de Rebocagem' },
    { entity: 'Praticagem', description: 'Serviço de Praticagem' },
    { entity: 'Amarradores', description: 'Serviço de Amarração' },
    { entity: 'Agência', description: 'Taxas de Agência Marítima' },
  ];

  return invoices.map(inv => ({
    id: uuidv4(),
    processId,
    entity: inv.entity,
    description: inv.description,
    reference: null,
    status: 'AWAITING' as InvoiceStatus,
    amount: null,
    receivedAt: null,
    dueDate: null,
  }));
}

// Create process
export function createProcess(data: {
  fileNumber?: string;
  srfNumber?: string;
  vesselName: string;
  imo: string;
  client: string;
  port: string;
  terminal: string;
  eta?: string;
  etd?: string;
  coordinator: string;
  observations?: string;
}): PortProcess {
  const processes = getProcesses();
  const now = new Date().toISOString();
  const id = uuidv4();

  const authorizations = createDefaultAuthorizations(id);
  const milestones = createDefaultMilestones(id);
  const invoices = createDefaultInvoices(id);

  const processBase: Omit<PortProcess, 'progress'> = {
    id,
    fileNumber: data.fileNumber || generateFileNumber(),
    srfNumber: data.srfNumber || generateSRF(),
    vesselName: data.vesselName,
    imo: data.imo,
    client: data.client,
    port: data.port,
    terminal: data.terminal,
    eta: data.eta || null,
    ata: null,
    etd: data.etd || null,
    atd: null,
    coordinator: data.coordinator,
    status: 'OPEN',
    observations: data.observations || null,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    authorizations,
    milestones,
    invoices,
    files: [],
    events: [{
      id: uuidv4(),
      processId: id,
      action: 'Ficheiro Criado',
      description: `Operação registada para ${data.vesselName}`,
      timestamp: now,
      user: 'Sistema',
    }],
  };

  const progress = calculateProgress(processBase);
  const newProcess: PortProcess = { ...processBase, progress };

  processes.push(newProcess);
  saveProcesses(processes);
  return newProcess;
}

// Update process
export function updateProcess(id: string, data: Partial<{
  vesselName: string;
  imo: string;
  client: string;
  port: string;
  terminal: string;
  eta: string;
  ata: string;
  etd: string;
  atd: string;
  coordinator: string;
  observations: string;
}>): PortProcess | null {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === id);
  if (index === -1) return null;

  Object.assign(processes[index], data, { updatedAt: new Date().toISOString() });
  processes[index].progress = calculateProgress(processes[index]);
  
  saveProcesses(processes);
  return processes[index];
}

// Close process
export function closeProcess(id: string): PortProcess | null {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === id);
  if (index === -1) return null;

  processes[index].status = 'CLOSED';
  processes[index].closedAt = new Date().toISOString();
  processes[index].updatedAt = new Date().toISOString();
  processes[index].progress = calculateProgress(processes[index]);

  processes[index].events.push({
    id: uuidv4(),
    processId: id,
    action: 'Ficheiro Encerrado',
    description: 'Operação encerrada — todas as pendências resolvidas',
    timestamp: new Date().toISOString(),
    user: 'Coordenador',
  });

  saveProcesses(processes);
  return processes[index];
}

// Update authorization
export function updateAuthorization(processId: string, authId: string, status: AuthorizationStatus): PortProcess | null {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === processId);
  if (index === -1) return null;

  const authIndex = processes[index].authorizations.findIndex(a => a.id === authId);
  if (authIndex === -1) return null;

  processes[index].authorizations[authIndex].status = status;
  if (status === 'RECEIVED') {
    processes[index].authorizations[authIndex].receivedAt = new Date().toISOString();
  }
  processes[index].updatedAt = new Date().toISOString();
  processes[index].progress = calculateProgress(processes[index]);

  processes[index].events.push({
    id: uuidv4(),
    processId,
    action: 'Autorização Atualizada',
    description: `${processes[index].authorizations[authIndex].entity}: ${status === 'RECEIVED' ? 'Recebida' : status === 'NOT_APPLICABLE' ? 'Não Aplicável' : 'Pendente'}`,
    timestamp: new Date().toISOString(),
    user: 'Coordenador',
  });

  saveProcesses(processes);
  return processes[index];
}

// Update milestone
export function updateMilestone(processId: string, milestoneId: string, confirmed: boolean, date?: string): PortProcess | null {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === processId);
  if (index === -1) return null;

  const msIndex = processes[index].milestones.findIndex(m => m.id === milestoneId);
  if (msIndex === -1) return null;

  processes[index].milestones[msIndex].confirmed = confirmed;
  if (date) processes[index].milestones[msIndex].date = date;
  else if (confirmed) processes[index].milestones[msIndex].date = new Date().toISOString();
  
  processes[index].updatedAt = new Date().toISOString();
  processes[index].progress = calculateProgress(processes[index]);

  // Auto-set ATA/ATD
  const ms = processes[index].milestones[msIndex];
  if (ms.name.includes('ATA') && confirmed) {
    processes[index].ata = ms.date;
  }
  if (ms.name.includes('ATD') && confirmed) {
    processes[index].atd = ms.date;
  }

  processes[index].events.push({
    id: uuidv4(),
    processId,
    action: confirmed ? 'Marco Confirmado' : 'Marco Desmarcado',
    description: ms.name,
    timestamp: new Date().toISOString(),
    user: 'Coordenador',
  });

  saveProcesses(processes);
  return processes[index];
}

// Update invoice
export function updateInvoice(processId: string, invoiceId: string, data: Partial<{
  status: InvoiceStatus;
  reference: string;
  amount: number;
  receivedAt: string;
  dueDate: string;
}>): PortProcess | null {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === processId);
  if (index === -1) return null;

  const invIndex = processes[index].invoices.findIndex(i => i.id === invoiceId);
  if (invIndex === -1) return null;

  Object.assign(processes[index].invoices[invIndex], data);
  if (data.status === 'RECEIVED' && !processes[index].invoices[invIndex].receivedAt) {
    processes[index].invoices[invIndex].receivedAt = new Date().toISOString();
  }
  
  processes[index].updatedAt = new Date().toISOString();
  processes[index].progress = calculateProgress(processes[index]);

  processes[index].events.push({
    id: uuidv4(),
    processId,
    action: 'Fatura Atualizada',
    description: `${processes[index].invoices[invIndex].entity} — ${data.status === 'RECEIVED' ? 'Recebida' : 'A receber'}`,
    timestamp: new Date().toISOString(),
    user: 'Financeiro',
  });

  saveProcesses(processes);
  return processes[index];
}

// Add file
export function addFileToProcess(processId: string, file: {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
}): ProcessFile | null {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === processId);
  if (index === -1) return null;

  const fileId = uuidv4();
  const storageKey = `processes/${processId}/${file.name}`;
  
  const newFile: ProcessFile = {
    id: fileId,
    processId,
    name: file.name,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    url: `#${storageKey}`,
    storageKey,
    createdAt: new Date().toISOString(),
  };

  processes[index].files.push(newFile);
  processes[index].updatedAt = new Date().toISOString();
  
  saveProcesses(processes);
  return newFile;
}

// Remove file
export function removeFileFromProcess(processId: string, fileId: string): boolean {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === processId);
  if (index === -1) return false;
  
  const fileIndex = processes[index].files.findIndex(f => f.id === fileId);
  if (fileIndex === -1) return false;
  
  processes[index].files.splice(fileIndex, 1);
  processes[index].updatedAt = new Date().toISOString();
  
  saveProcesses(processes);
  return true;
}

// Search
export function searchProcesses(query: string, status?: ProcessStatus | 'ALL'): PortProcess[] {
  let processes = getProcesses();
  
  if (status && status !== 'ALL') {
    processes = processes.filter(p => p.status === status);
  }
  
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    processes = processes.filter(p => 
      p.fileNumber.toLowerCase().includes(q) ||
      p.srfNumber.toLowerCase().includes(q) ||
      p.vesselName.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      p.port.toLowerCase().includes(q) ||
      p.coordinator.toLowerCase().includes(q)
    );
  }
  
  return processes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Get pending count for a process
export function getPendingCount(process: PortProcess): number {
  const pendingAuths = process.authorizations.filter(a => a.status === 'PENDING').length;
  const pendingMilestones = process.milestones.filter(m => !m.confirmed).length;
  const pendingInvoices = process.invoices.filter(i => i.status === 'AWAITING').length;
  return pendingAuths + pendingMilestones + pendingInvoices;
}

// Seed demo data
export function seedDemoData(): void {
  const existing = getProcesses();
  if (existing.length > 0) return;

  const demoData = [
    {
      vesselName: 'MSC AURORA',
      imo: '9839012',
      client: 'MSC — Mediterranean Shipping Company',
      port: 'Porto de Sines',
      terminal: 'Terminal XXI',
      eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      etd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      coordinator: 'Carlos Mendes',
      observations: 'Navio porta-contentores. Operação de descarga prioritária.',
    },
    {
      vesselName: 'MAERSK EDINBURGH',
      imo: '9712456',
      client: 'Maersk Line',
      port: 'Porto de Leixões',
      terminal: 'Terminal de Contentores',
      eta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      etd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      coordinator: 'Ana Rodrigues',
      observations: 'Carregamento parcial — contentores refrigerados.',
    },
    {
      vesselName: 'CMA CGM MARCO POLO',
      imo: '9454468',
      client: 'CMA CGM Group',
      port: 'Porto de Lisboa',
      terminal: 'Terminal de Alcântara',
      eta: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      etd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      coordinator: 'Pedro Santos',
      observations: 'Escala técnica para abastecimento.',
    },
    {
      vesselName: 'HAPAG LLOYD BERLIN',
      imo: '9678234',
      client: 'Hapag-Lloyd AG',
      port: 'Porto de Sines',
      terminal: 'Terminal XXI',
      eta: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      etd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      coordinator: 'Carlos Mendes',
      observations: 'Operação concluída. Aguardando faturas finais.',
    },
    {
      vesselName: 'EVER GIVEN',
      imo: '9811000',
      client: 'Evergreen Marine',
      port: 'Porto de Sines',
      terminal: 'Terminal XXI',
      eta: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      etd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      coordinator: 'Maria Ferreira',
      observations: 'Ficheiro encerrado. Todas as pendências resolvidas.',
    },
  ];

  demoData.forEach((data, idx) => {
    const process = createProcess(data);
    
    // Simulate progress for different stages
    if (idx === 2) {
      // Ship arrived, operations ongoing
      const p = getProcessById(process.id)!;
      p.ata = p.eta;
      p.authorizations[0].status = 'RECEIVED';
      p.authorizations[0].receivedAt = p.eta;
      p.authorizations[1].status = 'RECEIVED';
      p.authorizations[1].receivedAt = p.eta;
      p.authorizations[3].status = 'RECEIVED';
      p.authorizations[3].receivedAt = p.eta;
      p.milestones[0].confirmed = true;
      p.milestones[0].date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      p.milestones[1].confirmed = true;
      p.milestones[1].date = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      p.milestones[2].confirmed = true;
      p.milestones[2].date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      p.milestones[3].confirmed = true;
      p.milestones[3].date = p.eta;
      p.milestones[4].confirmed = true;
      p.milestones[4].date = new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString();
      p.invoices[0].status = 'RECEIVED';
      p.invoices[0].amount = 45000;
      p.invoices[0].reference = 'INV-2024-001';
      p.invoices[1].status = 'RECEIVED';
      p.invoices[1].amount = 28000;
      p.invoices[1].reference = 'INV-2024-002';
      p.progress = calculateProgress(p);
      saveProcesses(getProcesses().map(pp => pp.id === p.id ? p : pp));
    }
    
    if (idx === 3) {
      // Ship departed, awaiting invoices
      const p = getProcessById(process.id)!;
      p.ata = p.eta;
      p.atd = p.etd;
      p.authorizations.forEach(a => { a.status = 'RECEIVED'; a.receivedAt = p.ata; });
      p.milestones.slice(0, 7).forEach(m => { m.confirmed = true; m.date = p.ata; });
      p.invoices[0].status = 'RECEIVED';
      p.invoices[0].amount = 52000;
      p.invoices[0].reference = 'INV-2024-010';
      p.invoices[1].status = 'RECEIVED';
      p.invoices[1].amount = 31000;
      p.invoices[1].reference = 'INV-2024-011';
      p.invoices[2].status = 'RECEIVED';
      p.invoices[2].amount = 8500;
      p.invoices[2].reference = 'INV-2024-012';
      p.progress = calculateProgress(p);
      saveProcesses(getProcesses().map(pp => pp.id === p.id ? p : pp));
    }

    if (idx === 4) {
      // Fully closed
      const p = getProcessById(process.id)!;
      p.ata = p.eta;
      p.atd = p.etd;
      p.status = 'CLOSED';
      p.closedAt = p.etd;
      p.authorizations.forEach(a => { a.status = 'RECEIVED'; a.receivedAt = p.ata; });
      p.milestones.forEach(m => { m.confirmed = true; m.date = p.ata; });
      p.invoices.forEach(inv => { 
        inv.status = 'RECEIVED'; 
        inv.amount = Math.floor(5000 + Math.random() * 50000);
        inv.reference = `INV-2024-${Math.floor(Math.random() * 999)}`;
        inv.receivedAt = p.atd;
      });
      p.progress = 100;
      saveProcesses(getProcesses().map(pp => pp.id === p.id ? p : pp));
    }
  });
}
