import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  apiAcceptInvitation,
  apiGetInvitation,
  type InvitationInfo,
} from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ROLE_HELP, ROLE_LABELS } from "../../lib/roles";
import { ROUTES } from "../../lib/routes";

const labelClass = "block text-sm font-medium text-text-secondary";
const inputClass =
  "w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-secondary placeholder-text-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary";

const MIN_PASSWORD = 10;

export function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, logout, refresh } = useAuth();

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Convite inválido ou expirado.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    apiGetInvitation(token)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Convite inválido ou expirado.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (name.trim().length < 2) {
      setError("Indique o seu nome.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(
        `A palavra-passe tem de ter pelo menos ${MIN_PASSWORD} caracteres.`,
      );
      return;
    }
    if (password !== confirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await apiAcceptInvitation(token, { name: name.trim(), password });
      // O servidor já iniciou a sessão (cookie): atualiza o estado e entra
      await refresh();
      navigate(ROUTES.dashboard, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar a conta. Tente novamente.",
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-sm text-text-muted">
        A verificar o convite...
      </div>
    );
  }

  if (loadError || !info) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 sm:py-24">
        <h1 className="font-[Syne] font-bold text-2xl">Convite indisponível</h1>
        <p role="alert" className="mt-3 text-sm text-text-secondary">
          {loadError ?? "Convite inválido ou expirado."} Peça ao administrador
          da empresa que envie um novo link.
        </p>
      </div>
    );
  }

  // Já tem sessão iniciada com outra conta: terminar primeiro
  if (user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 sm:py-24">
        <h1 className="font-[Syne] font-bold text-2xl">
          Convite para {info.organizationName}
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          Tem a sessão iniciada como <strong>{user.name}</strong>. Para aceitar
          este convite, termine primeiro essa sessão.
        </p>
        <button
          onClick={() => logout()}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Terminar sessão
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16 sm:py-24">
      <h1 className="font-[Syne] font-bold text-2xl">
        Entrar em {info.organizationName}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Foi convidado como <strong>{ROLE_LABELS[info.role]}</strong>.{" "}
        {ROLE_HELP[info.role]}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <span className={labelClass}>E-mail</span>
          <p className="px-4 py-2.5 rounded-lg border border-border text-sm text-text-muted">
            {info.email}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClass}>
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className={labelClass}>
            Palavra-passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-text-muted">
            Pelo menos {MIN_PASSWORD} caracteres.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm" className={labelClass}>
            Repita a palavra-passe
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-[#E24B4A]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "A criar conta..." : "Criar conta e entrar"}
        </button>
      </form>
    </div>
  );
}
