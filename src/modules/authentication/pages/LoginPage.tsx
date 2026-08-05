import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import { portalDefinitions } from "../constants/portals";
import { useAuth } from "../providers/AuthProvider";
import type { PortalKey } from "../types/authContext.types";
import { getDashboardPathForActiveContext } from "../utils/routing";

const validPortals = new Set<PortalKey>(["institution", "branch", "office", "parent", "platform"]);

export function LoginPage({ platform = false }: { platform?: boolean }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const portal = platform ? "platform" : ((params.get("portal") ?? "institution") as PortalKey);

  if (!validPortals.has(portal)) return <Navigate to="/" replace />;
  if (auth.isAuthenticated && auth.activeContext != null) {
    return <Navigate to={getDashboardPathForActiveContext(auth.activeContext)} replace />;
  }

  const definition = portalDefinitions[portal];

  async function handleSubmit(email: string, password: string) {
    setError(null);
    try {
      const selectedContext = await auth.login({ email, password }, portal);
      if (selectedContext == null) {
        navigate("/select-context");
        return;
      }
      navigate(getDashboardPathForActiveContext(selectedContext));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Sign in failed.");
      if (auth.isAuthenticated) navigate("/select-context");
    }
  }

  return (
    <main className="auth-page">
      <section>
        <p className="eyebrow">Secure sign in</p>
        <h1>{definition.label}</h1>
        <p>{definition.description}</p>
        <p className="muted">Your portal choice does not grant access. Assigned roles are verified by the backend.</p>
      </section>
      <LoginForm portal={portal} onSubmit={handleSubmit} error={error} />
    </main>
  );
}
