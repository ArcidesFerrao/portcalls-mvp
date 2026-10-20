import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { useEffect } from "react";
import { Anchor, Settings } from "lucide-react";
import { Demo } from "./app/Demo";
import { NewProcess } from "./app/NewProcess";
import { ProcessDetails } from "./app/ProcessDetails";
import { Setup } from "./app/Setup";
import { seedDemoData } from "./lib/store";
import { isSharePointConfigured } from "./lib/config";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { Landing } from "./app/Landing";
import { Login } from "./app/auth/Login";
import { Dashboard } from "./app/Dashboard";

function LegacyProcessRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/processes/${id}`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protegido */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="processes/new" element={<NewProcess />} />
        <Route path="processes/:id" element={<ProcessDetails />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <Setup />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* URLs antigos */}
      <Route path="/setup" element={<Navigate to="/app/settings" replace />} />
      <Route
        path="/processes/new"
        element={<Navigate to="/app/processes/new" replace />}
      />
      <Route path="/processes/:id" element={<LegacyProcessRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
