import { useCallback, useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  apiCreateInvitation,
  apiListInvitations,
  apiListMembers,
  apiRevokeInvitation,
  apiUpdateMember,
  type CreatedInvitation,
  type Member,
  type PendingInvitation,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { ROLES, ROLE_HELP, ROLE_LABELS, type Role } from "../lib/roles";

const fieldClass =
  "px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary";

const HEAD =
  "text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider";

const fmt = (iso: string) =>
  format(new Date(iso), "d MMM yyyy, HH:mm", { locale: pt });

export function Team() {
  const { user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("COORDENADOR");
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [m, i] = await Promise.all([
        apiListMembers(),
        apiListInvitations(),
      ]);
      setMembers(m);
      setInvitations(i);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar a equipa.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Executa uma ação: impede cliques duplos e mostra o erro do servidor
  async function run(action: () => Promise<void>): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setActionError("");
    try {
      await action();
      return true;
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a ação.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setCreated(null);
    setCopied(false);
    const ok = await run(async () => {
      const invitation = await apiCreateInvitation({
        email: email.trim(),
        role,
      });
      setCreated(invitation);
      setInvitations(await apiListInvitations());
    });
    if (ok) setEmail("");
  }

  async function copyLink() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.link);
      setCopied(true);
    } catch {
      setActionError(
        "Não foi possível copiar. Selecione o link e copie à mão.",
      );
    }
  }

  function changeRole(member: Member, next: Role) {
    if (next === member.role) return;
    run(async () => {
      const updated = await apiUpdateMember(member.id, { role: next });
      setMembers((list) =>
        list.map((m) => (m.id === updated.id ? updated : m)),
      );
    });
  }

  function toggleDisabled(member: Member) {
    const disabling = !member.disabled;
    if (
      disabling &&
      !window.confirm(
        `Desativar ${member.name}? A pessoa perde o acesso de imediato.`,
      )
    ) {
      return;
    }
    run(async () => {
      const updated = await apiUpdateMember(member.id, { disabled: disabling });
      setMembers((list) =>
        list.map((m) => (m.id === updated.id ? updated : m)),
      );
    });
  }

  function revoke(invitation: PendingInvitation) {
    run(async () => {
      await apiRevokeInvitation(invitation.id);
      setInvitations((list) => list.filter((i) => i.id !== invitation.id));
      if (created?.id === invitation.id) setCreated(null);
    });
  }

  const whatsappUrl = created
    ? `https://wa.me/?text=${encodeURIComponent(
        `Foi convidado para o PortOps (${user?.organizationName ?? "a nossa empresa"}). Crie a sua conta aqui: ${created.link}`,
      )}`
    : "#";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold font-[Syne]">Equipa</h1>
        <p className="text-text-secondary mt-1">
          Convide colegas e escolha o que cada um pode fazer.
        </p>
      </div>

      {actionError && (
        <div
          role="alert"
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
        >
          {actionError}
        </div>
      )}

      {/* Convidar */}
      <Card className="p-6 space-y-5">
        <h2 className="font-semibold font-[Syne]">Convidar uma pessoa</h2>

        <form
          onSubmit={handleInvite}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="email"
            required
            placeholder="e-mail da pessoa"
            aria-label="E-mail da pessoa"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${fieldClass} flex-1`}
          />
          <select
            aria-label="Papel"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={fieldClass}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={busy}>
            Gerar convite
          </Button>
        </form>

        <p className="text-xs text-text-muted">{ROLE_HELP[role]}</p>

        {created && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-sm text-text-secondary">
              Convite para <strong>{created.email}</strong> (
              {ROLE_LABELS[created.role]}). Válido até {fmt(created.expiresAt)}.
              Este link só aparece agora; se o perder, gere outro.
            </p>
            <input
              readOnly
              aria-label="Link do convite"
              value={created.link}
              onFocus={(e) => e.currentTarget.select()}
              className={`${fieldClass} w-full font-mono text-xs`}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={copyLink}>
                {copied ? "Copiado" : "Copiar link"}
              </Button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                Enviar por WhatsApp
              </a>
            </div>
          </div>
        )}
      </Card>

      {loading ? (
        <Card className="p-12 text-center text-sm text-text-muted">
          A carregar a equipa...
        </Card>
      ) : loadError ? (
        <Card className="p-8 text-center space-y-4">
          <p role="alert" className="text-sm text-red-400">
            {loadError}
          </p>
          <Button onClick={load}>Tentar novamente</Button>
        </Card>
      ) : (
        <>
          {/* Convites pendentes */}
          {invitations.length > 0 && (
            <Card className="overflow-hidden">
              <h2 className="font-semibold font-[Syne] px-4 pt-4">
                Convites pendentes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm mt-3">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/50">
                      <th className={HEAD}>E-mail</th>
                      <th className={HEAD}>Papel</th>
                      <th className={HEAD}>Validade</th>
                      <th className={`${HEAD} text-right`}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/50">
                        <td className="px-4 py-3 text-text-secondary">
                          {inv.email}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {ROLE_LABELS[inv.role]}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {inv.expired ? (
                            <span className="text-amber-400">Expirado</span>
                          ) : (
                            <span className="text-text-muted">
                              {fmt(inv.expiresAt)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => revoke(inv)}
                            disabled={busy}
                            className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            Revogar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-3 text-xs text-text-muted">
                Para um novo link, convide outra vez o mesmo e-mail: o anterior
                deixa de funcionar.
              </p>
            </Card>
          )}

          {/* Membros */}
          <Card className="overflow-hidden">
            <h2 className="font-semibold font-[Syne] px-4 pt-4">
              Membros ({members.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr className="border-b border-border bg-surface-2/50">
                    <th className={HEAD}>Nome</th>
                    <th className={HEAD}>Papel</th>
                    <th className={HEAD}>Estado</th>
                    <th className={`${HEAD} text-right`}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const isSelf = member.id === user?.id;
                    return (
                      <tr key={member.id} className="border-b border-border/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">
                            {member.name}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-text-muted">
                                (você)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-muted">
                            {member.email}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            aria-label={`Papel de ${member.name}`}
                            value={member.role}
                            disabled={isSelf || busy}
                            onChange={(e) =>
                              changeRole(member, e.target.value as Role)
                            }
                            className={`${fieldClass} disabled:opacity-60`}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {member.disabled ? (
                            <span className="text-amber-400">Desativado</span>
                          ) : (
                            <span className="text-primary">Ativo</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => toggleDisabled(member)}
                              disabled={busy}
                              className="text-xs font-medium text-text-secondary hover:text-primary disabled:opacity-50"
                            >
                              {member.disabled ? "Reativar" : "Desativar"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
