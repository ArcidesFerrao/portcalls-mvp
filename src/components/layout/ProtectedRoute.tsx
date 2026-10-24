import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Role, useAuth } from "../lib/auth";
// import { useAuth, type Role } from "../../lib/auth";

interface Props {
  children?: ReactNode;
  roles?: Role[]; // se definido, só estes papéis entram
}

export function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Enquanto o servidor não responde, não redirecionar:
  // evita o "flash" de ir para /login com a sessão válida.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted text-sm">
        A carregar...
      </div>
    );
  }

  // Sem sessão: vai para o login e guarda de onde veio
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Com sessão, mas sem o papel exigido
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
