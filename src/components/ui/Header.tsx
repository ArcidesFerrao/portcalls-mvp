import { Anchor, LogOut, Settings } from "lucide-react";
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { seedDemoData } from "../../lib/store";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? "bg-primary/10 text-primary font-medium"
      : "text-text-muted hover:text-foreground hover:bg-surface-2"
  }`;

export default function Header() {
  const location = useLocation();

  useEffect(() => {
    seedDemoData();
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-[#f8f9f7]/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
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
            <Link
              to="/processes/new"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/processes/new"
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary hover:text-white hover:bg-surface-2"
              }`}
            >
              Nova Operação
            </Link>
            <Link
              to="/setup"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/setup"
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary hover:text-white hover:bg-surface-2"
              }`}
              title="Configuração de Armazenamento"
            >
              <Settings size={16} />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
