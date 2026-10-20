import { Link, Outlet } from "react-router-dom";
import { Anchor } from "lucide-react";
import { useAuth } from "../../lib/auth";
import Footer from "../ui/Footer";

const navLink =
  "px-3 py-2 rounded-lg text-sm font-medium transition-colors text-text-secondary hover:text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50";

export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Anchor size={20} />
            </span>
            <span className="font-[Syne] font-bold text-lg">PortOps</span>
          </Link>

          <nav>
            {user ? (
              <Link to="/app" className={navLink}>
                Ir para o painel
              </Link>
            ) : (
              <Link to="/login" className={navLink}>
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
