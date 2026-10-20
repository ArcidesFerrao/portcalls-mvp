import { Outlet } from "react-router-dom";
// import { useAuth } from "../../lib/auth";
import Footer from "../ui/Footer";
import Header from "../ui/Header";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "text-primary bg-primary/10"
      : "text-text-secondary hover:text-white hover:bg-surface-2"
  }`;

export function AppLayout() {
  return (
    // Classes de fundo e header copiadas do layout actual
    <div className="min-h-screen bg-[#e0f5f5] flex flex-col">
      {/* Navigation */}
      <Header />
      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
      {/* Footer */}

      <Footer />
    </div>
  );
}
