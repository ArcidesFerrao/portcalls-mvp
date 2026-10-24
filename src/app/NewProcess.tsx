import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ship } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Card } from "../components/ui/Card";
import { createProcess } from "../lib/data";
import { useAuth } from "../lib/auth";
import { ROUTES } from "../lib/routes";

// datetime-local não tem fuso horário ("2026-10-30T10:00"). Convertemos aqui,
// no navegador, para uma data absoluta; se fosse o servidor a interpretar,
// usaria o fuso dele (UTC) e a hora sairia deslocada.
function toIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function NewProcess() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vesselName, setVesselName] = useState("");
  const [imo, setImo] = useState("");
  const [client, setClient] = useState("");
  const [port, setPort] = useState("");
  const [terminal, setTerminal] = useState("");
  const [eta, setEta] = useState("");
  const [etd, setEtd] = useState("");
  const [observations, setObservations] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearError(field: string) {
    setErrors((prev) => {
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!vesselName.trim())
      newErrors.vesselName = "Nome do navio é obrigatório";
    if (!client.trim()) newErrors.client = "Cliente é obrigatório";
    if (!port.trim()) newErrors.port = "Porto é obrigatório";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const created = await createProcess({
        vesselName: vesselName.trim(),
        imo: imo.trim() || undefined,
        client: client.trim(),
        port: port.trim(),
        terminal: terminal.trim() || undefined,
        eta: toIso(eta),
        etd: toIso(etd),
        observations: observations.trim() || undefined,
      });

      navigate(ROUTES.process(created.id));
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Erro ao criar operação. Tente novamente.",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-[Syne]">
            Nova Operação Portuária
          </h1>
          <p className="text-text-secondary text-sm">
            Registar uma nova escala de navio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do navio */}
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
              onChange={(e) => {
                setVesselName(e.target.value);
                clearError("vesselName");
              }}
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
            onChange={(e) => {
              setClient(e.target.value);
              clearError("client");
            }}
            error={errors.client}
          />
        </Card>

        {/* Porto e terminal */}
        <Card className="p-6 space-y-5">
          <h3 className="font-semibold font-[Syne]">Porto e Terminal</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Porto"
              placeholder="Ex: Porto de Maputo"
              value={port}
              onChange={(e) => {
                setPort(e.target.value);
                clearError("port");
              }}
              error={errors.port}
            />
            <Input
              label="Terminal"
              placeholder="Ex: Terminal de Contentores"
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

        {/* Coordenação e observações */}
        <Card className="p-6 space-y-5">
          <h3 className="font-semibold font-[Syne]">Coordenação</h3>

          <p className="text-sm text-text-secondary">
            Coordenador de Operações:{" "}
            <span className="font-medium text-white">{user?.name}</span>
          </p>

          <Textarea
            label="Observações"
            placeholder="Notas sobre a operação (opcional)"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
          />
        </Card>

        {errors.submit && (
          <div
            role="alert"
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
          >
            {errors.submit}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "A criar..." : "Criar Operação"}
          </Button>
        </div>
      </form>
    </div>
  );
}
