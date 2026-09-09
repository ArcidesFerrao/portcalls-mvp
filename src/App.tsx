import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { FolderKanban } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { NewProcess } from './pages/NewProcess';
import { ProcessDetails } from './pages/ProcessDetails';
import { seedDemoData } from './lib/store';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    seedDemoData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <FolderKanban size={20} className="text-primary" />
              </div>
              <span className="font-[Syne] font-bold text-lg hidden sm:block">
                ProcessManager
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'text-primary bg-primary/10'
                    : 'text-text-secondary hover:text-white hover:bg-surface-2'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/processes/new"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/processes/new'
                    ? 'text-primary bg-primary/10'
                    : 'text-text-secondary hover:text-white hover:bg-surface-2'
                }`}
              >
                Novo
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
            <span>© 2024 ProcessManager — MVP</span>
            <span>Gestão de Processos e Documentos</span>
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
