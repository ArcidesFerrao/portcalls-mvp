import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { Anchor } from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { NewProcess } from "./pages/NewProcess";
import { ProcessDetails } from "./pages/ProcessDetails";
import { seedDemoData } from "./lib/store";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    seedDemoData();
  }, []);

  return (
    <div className="min-h-screen bg-[#e0f5f5] flex flex-col">
      {/* Navigation */}
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
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/"
                    ? "text-primary bg-primary/10"
                    : "text-text-secondary hover:text-white hover:bg-primary"
                }`}
              >
                Painel
              </Link>
              <Link
                to="/processes/new"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/processes/new"
                    ? "text-primary bg-primary/10"
                    : "text-text-secondary hover:text-white hover:bg-primary"
                }`}
              >
                Nova Operação
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
            <span>
              © 2026 PortOps — Sistema de Gestão de Operações Portuárias
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              Sistema em fase de teste
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/processes/new" element={<NewProcess />} />
          <Route path="/processes/:id" element={<ProcessDetails />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
