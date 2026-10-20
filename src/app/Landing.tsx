import { Link } from "react-router-dom";
import { Bell, Cloud, Flag, Receipt, ShieldCheck } from "lucide-react";
import { whatsappUrl } from "../lib/contact";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50";
const secondaryBtn =
  "inline-flex items-center justify-center rounded-lg border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50";

// Cores semânticas do design system
const AMBER = "#EF9F27";
const RED = "#E24B4A";

const SAMPLE_AUTHORIZATIONS = [
  { entity: "Alfândega", received: true },
  { entity: "Imigração", received: false },
  { entity: "Saúde portuária", received: false },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Autorizações",
    text: "Cada entidade com o seu estado: recebida, pendente ou não aplicável, e o dia em que chegou.",
  },
  {
    icon: Flag,
    title: "Marcos da operação",
    text: "Os marcos da escala, por ordem. Ao confirmar a chegada e a saída, o sistema regista o ATA e o ATD.",
  },
  {
    icon: Receipt,
    title: "Faturas",
    text: "O que ainda falta receber e o que já chegou, por entidade.",
  },
  {
    icon: Bell,
    title: "Alertas",
    text: "Uma operação passa a crítica quando tem cinco ou mais pendências, ou quando a saída está a menos de 48 horas.",
  },
  {
    icon: Cloud,
    title: "Documentos no SharePoint",
    text: "Os ficheiros de cada operação ficam no SharePoint da empresa. Em validação com o primeiro cliente.",
  },
];

function SampleOperation() {
  const confirmed = 6;
  const total = 10;

  return (
    <div
      aria-label="Exemplo de operação no painel"
      className="bg-surface border border-border rounded-xl p-6 space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[Syne] font-bold text-lg">MV Atlântico</p>
          <p className="text-xs text-text-muted">Porto da Beira</p>
        </div>
        <p
          className="text-xs font-medium rounded-md px-2 py-1"
          style={{ color: RED, backgroundColor: `${RED}1a` }}
        >
          Crítica: saída em 36 h, 3 pendências
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-sm font-medium text-text-secondary">Marcos</p>
          <p className="text-xs text-text-muted">
            {confirmed} de {total} confirmados
          </p>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < confirmed ? "bg-primary" : "border border-border"
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">
          Autorizações
        </p>
        <ul className="divide-y divide-border">
          {SAMPLE_AUTHORIZATIONS.map((a) => (
            <li
              key={a.entity}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-text-secondary">{a.entity}</span>
              <span
                className="text-xs font-medium"
                style={{ color: a.received ? undefined : AMBER }}
              >
                {a.received ? (
                  <span className="text-primary">Recebida</span>
                ) : (
                  "Pendente"
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-text-secondary border-t border-border pt-4">
        2 faturas em falta
      </p>
    </div>
  );
}

export function Landing() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h1 className="font-[Syne] font-bold text-4xl sm:text-5xl leading-tight max-w-xl">
              Saiba o que falta para cada navio largar.
            </h1>
            <p className="mt-6 text-text-secondary max-w-md leading-relaxed">
              O PortOps junta autorizações, marcos e faturas de cada operação
              portuária num só painel e avisa quando uma saída está em risco.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryBtn}
              >
                Pedir demonstração
              </a>
              <Link to="/login" className={secondaryBtn}>
                Entrar
              </Link>
            </div>
          </div>

          <SampleOperation />
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="font-[Syne] font-bold text-2xl max-w-md">
            O que o PortOps acompanha em cada operação
          </h2>

          <ul className="mt-10 divide-y divide-border border-y border-border">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="grid gap-2 sm:grid-cols-[16rem_1fr] sm:gap-8 py-6"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-primary shrink-0" />
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="font-[Syne] font-bold text-2xl max-w-md">
            Quer ver com as vossas operações?
          </h2>
          <p className="mt-3 text-text-secondary max-w-md">
            Mostramos o painel a partir de um exemplo da vossa folha de registo.
          </p>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={`${primaryBtn} mt-6`}
          >
            Pedir demonstração
          </a>
        </div>
      </section>
    </>
  );
}
