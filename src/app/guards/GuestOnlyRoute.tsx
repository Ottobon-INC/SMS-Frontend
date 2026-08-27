import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../modules/authentication/providers/AuthProvider";
import { getDashboardPathForActiveContext } from "../../modules/authentication/utils/routing";

export function GuestOnlyRoute() {
  const auth = useAuth();
  if (auth.loading) return null;
  if (auth.isAuthenticated && !auth.contextResolved) return null;
  if (auth.isAuthenticated && auth.activeContext != null) {
    return <Navigate to={getDashboardPathForActiveContext(auth.activeContext)} replace />;
  }
  if (auth.isAuthenticated) return <Navigate to="/select-context" replace />;
  return <Outlet />;
}
