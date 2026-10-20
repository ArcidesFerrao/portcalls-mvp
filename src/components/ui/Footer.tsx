import React from "react";
import { isSharePointConfigured } from "../../lib/config";

export default function Footer() {
  const isConfigured = isSharePointConfigured();
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
          <span>
            © 2025 PortOps — Sistema de Gestão de Operações Portuárias
          </span>
          <span className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConfigured ? "bg-primary" : "bg-amber-400"} animate-pulse`}
            />
            {isConfigured ? "SharePoint conectado" : "Modo local"}
          </span>
        </div>
      </div>
    </footer>
  );
}
