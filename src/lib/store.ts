import { v4 as uuidv4 } from 'uuid';
import { Process, ProcessFile, ProcessStatus, ProcessStats } from './types';

const PROCESSES_KEY = 'processes_db';

function getProcesses(): Process[] {
  const data = localStorage.getItem(PROCESSES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveProcesses(processes: Process[]): void {
  localStorage.setItem(PROCESSES_KEY, JSON.stringify(processes));
}

// Generate unique reference
function generateReference(): string {
  const prefix = 'PRC';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Get all processes
export function getAllProcesses(): Process[] {
  return getProcesses().sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Get process by ID
export function getProcessById(id: string): Process | null {
  const processes = getProcesses();
  return processes.find(p => p.id === id) || null;
}

// Get stats
export function getStats(): ProcessStats {
  const processes = getProcesses();
  return {
    total: processes.length,
    open: processes.filter(p => p.status === 'OPEN').length,
    closed: processes.filter(p => p.status === 'CLOSED').length,
  };
}

// Create process
export function createProcess(data: {
  title: string;
  description?: string;
}): Process {
  const processes = getProcesses();
  const now = new Date().toISOString();
  
  const newProcess: Process = {
    id: uuidv4(),
    reference: generateReference(),
    title: data.title,
    description: data.description || null,
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    files: [],
  };

  processes.push(newProcess);
  saveProcesses(processes);
  return newProcess;
}

// Update process
export function updateProcess(id: string, data: {
  title?: string;
  description?: string;
}): Process | null {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  const process = processes[index];
  if (data.title !== undefined) process.title = data.title;
  if (data.description !== undefined) process.description = data.description || null;
  process.updatedAt = new Date().toISOString();
  
  processes[index] = process;
  saveProcesses(processes);
  return process;
}

// Close process
export function closeProcess(id: string): Process | null {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  processes[index].status = 'CLOSED';
  processes[index].closedAt = new Date().toISOString();
  processes[index].updatedAt = new Date().toISOString();
  
  saveProcesses(processes);
  return processes[index];
}

// Add file to process
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

// Remove file from process
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

// Search processes
export function searchProcesses(query: string, status?: ProcessStatus | 'ALL'): Process[] {
  let processes = getProcesses();
  
  if (status && status !== 'ALL') {
    processes = processes.filter(p => p.status === status);
  }
  
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    processes = processes.filter(p => 
      p.reference.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }
  
  return processes.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Seed demo data
export function seedDemoData(): void {
  const existing = getProcesses();
  if (existing.length > 0) return;

  const demoProcesses: Partial<Process>[] = [
    {
      title: 'Licença de Construção — Edifício Central',
      description: 'Processo de licenciamento para construção do novo edifício central na zona empresarial.',
      status: 'OPEN' as ProcessStatus,
    },
    {
      title: 'Renovação de Alvará Comercial',
      description: 'Renovação anual do alvará comercial para o espaço retail.',
      status: 'OPEN' as ProcessStatus,
    },
    {
      title: 'Contrato de Prestação de Serviços Q1',
      description: 'Contrato trimestral de prestação de serviços de consultoria.',
      status: 'CLOSED' as ProcessStatus,
    },
    {
      title: 'Auditoria Interna — Departamento Financeiro',
      description: 'Auditoria interna anual ao departamento financeiro.',
      status: 'CLOSED' as ProcessStatus,
    },
    {
      title: 'Projeto de Remodelação — Piso 3',
      description: 'Remodelação completa do terceiro piso do edifício principal.',
      status: 'OPEN' as ProcessStatus,
    },
  ];

  demoProcesses.forEach(p => {
    createProcess({ title: p.title!, description: p.description ?? undefined });
  });
}
