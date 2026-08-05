import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../modules/authentication/providers/AuthProvider";

export function ProtectedRoute({
  contextRequired = true,
  permission,
  module
}: {
  contextRequired?: boolean;
  permission?: string;
  module?: string;
}) {
  const auth = useAuth();
  if (auth.loading) return <div className="content">Loading authentication...</div>;
  if (!auth.isAuthenticated) return <Navigate to="/" replace />;
  if (contextRequired && auth.activeContext == null) return <Navigate to="/select-context" replace />;
  if (permission != null && !auth.hasPermission(permission)) return <Navigate to="/access-denied" replace />;
  if (module != null && !auth.hasModule(module)) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
}
