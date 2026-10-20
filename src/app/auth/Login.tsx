import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { whatsappUrl } from "../../lib/contact";

const labelClass = "block text-sm font-medium text-text-secondary";
const inputClass =
  "w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-secondary placeholder-text-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary";

export function Login() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quando o login termina, o AuthProvider actualiza o utilizador
  // e este redireccionamento leva-o para onde ia.
  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível iniciar sessão.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16 sm:py-24">
      <h1 className="font-[Syne] font-bold text-2xl">Entrar no PortOps</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Use o e-mail da sua conta na empresa.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="nome@empresa.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className={labelClass}>
            Palavra-passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? "A entrar..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-text-muted">
        Ainda não tem acesso?{" "}
        <a
          href={whatsappUrl("Olá, gostaria de pedir acesso ao PortOps.")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Peça acesso
        </a>
      </p>
    </div>
  );
}
