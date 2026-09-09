import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ship } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { createProcess } from '../lib/store';

export function NewProcess() {
  const navigate = useNavigate();
  
  const [vesselName, setVesselName] = useState('');
  const [imo, setImo] = useState('');
  const [client, setClient] = useState('');
  const [port, setPort] = useState('');
  const [terminal, setTerminal] = useState('');
  const [eta, setEta] = useState('');
  const [etd, setEtd] = useState('');
  const [coordinator, setCoordinator] = useState('');
  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!vesselName.trim()) newErrors.vesselName = 'Nome do navio é obrigatório';
    if (!client.trim()) newErrors.client = 'Cliente é obrigatório';
    if (!port.trim()) newErrors.port = 'Porto é obrigatório';
    if (!coordinator.trim()) newErrors.coordinator = 'Coordenador é obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const process = createProcess({
        vesselName: vesselName.trim(),
        imo: imo.trim(),
        client: client.trim(),
        port: port.trim(),
        terminal: terminal.trim(),
        eta: eta || undefined,
        etd: etd || undefined,
        coordinator: coordinator.trim(),
        observations: observations.trim() || undefined,
      });

      navigate(`/processes/${process.id}`);
    } catch {
      setErrors({ submit: 'Erro ao criar operação. Tente novamente.' });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-[Syne]">Nova Operação Portuária</h1>
          <p className="text-text-secondary text-sm">Registar uma nova escala de navio</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vessel Info */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Ship size={18} className="text-primary" />
            <h3 className="font-semibold font-[Syne]">Dados do Navio</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do Navio"
              placeholder="Ex: MSC AURORA"
              value={vesselName}
              onChange={(e) => { setVesselName(e.target.value); setErrors(prev => { const { vesselName, ...rest } = prev; return rest; }); }}
              error={errors.vesselName}
              autoFocus
            />
            <Input
              label="IMO"
              placeholder="Ex: 9839012"
              value={imo}
              onChange={(e) => setImo(e.target.value)}
            />
          </div>

          <Input
            label="Cliente / Principal"
            placeholder="Ex: MSC — Mediterranean Shipping Company"
            value={client}
            onChange={(e) => { setClient(e.target.value); setErrors(prev => { const { client, ...rest } = prev; return rest; }); }}
            error={errors.client}
          />
        </Card>

        {/* Port Info */}
        <Card className="p-6 space-y-5">
          <h3 className="font-semibold font-[Syne]">Porto e Terminal</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Porto"
              placeholder="Ex: Porto de Sines"
              value={port}
              onChange={(e) => { setPort(e.target.value); setErrors(prev => { const { port, ...rest } = prev; return rest; }); }}
              error={errors.port}
            />
            <Input
              label="Terminal"
              placeholder="Ex: Terminal XXI"
              value={terminal}
              onChange={(e) => setTerminal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="ETA (Estimada)"
              type="datetime-local"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
            />
            <Input
              label="ETD (Estimada)"
              type="datetime-local"
              value={etd}
              onChange={(e) => setEtd(e.target.value)}
            />
          </div>
        </Card>

        {/* Coordinator & Observations */}
        <Card className="p-6 space-y-5">
          <h3 className="font-semibold font-[Syne]">Coordenação</h3>

          <Input
            label="Coordenador de Operações"
            placeholder="Ex: Carlos Mendes"
            value={coordinator}
            onChange={(e) => { setCoordinator(e.target.value); setErrors(prev => { const { coordinator, ...rest } = prev; return rest; }); }}
            error={errors.coordinator}
          />

          <Textarea
            label="Observações"
            placeholder="Notas sobre a operação (opcional)"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
          />
        </Card>

        {errors.submit && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'A criar...' : 'Criar Operação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
