import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Anchor, LogOut, Settings } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { canManageTeam, canOperate } from "../../lib/permissions";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "text-primary bg-primary/10"
      : "text-text-secondary hover:text-white hover:bg-surface-2"
  }`;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    // Classes de fundo e header copiadas do layout actual
    <div className="min-h-screen bg-[#e0f5f5] flex flex-col">
      <header className="sticky top-0 z-40 bg-[#f8f9f7]/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/app" className="flex items-center gap-3 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Anchor size={20} className="text-primary" />
              </div>
              <div className="hidden sm:block">
                <span className="font-[Syne] font-bold text-lg">PortOps</span>
                <span className="text-text-muted text-xs block -mt-1">
                  Gestão de Operações Portuárias
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              <NavLink to="/app" end className={linkClass}>
                Painel
              </NavLink>
              {canOperate(user?.role) && (
                <NavLink to="/app/processes/new" className={linkClass}>
                  Nova Operação
                </NavLink>
              )}
              {canManageTeam(user?.role) && (
                <NavLink to="/app/team" className={linkClass}>
                  Equipa
                </NavLink>
              )}
              {user?.role === "ADMIN" && (
                <NavLink
                  to="/app/settings"
                  className={linkClass}
                  title="Configuração de Armazenamento"
                >
                  <Settings size={16} />
                </NavLink>
              )}

              <div className="ml-3 pl-3 border-l border-border flex items-center gap-2">
                <span className="hidden md:block text-xs text-text-muted">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-surface-2 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs text-text-muted">
          © {new Date().getFullYear()} PortOps
          {user?.organizationName ? `, ${user.organizationName}` : ""}
        </div>
      </footer>
    </div>
  );
}
