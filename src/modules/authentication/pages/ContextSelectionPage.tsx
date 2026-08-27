import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthTransitionScreen } from "../components/AuthTransitionScreen";
import { useAuth } from "../providers/AuthProvider";
import { getDashboardPathForActiveContext, getDashboardPathForContext } from "../utils/routing";

export function ContextSelectionPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [showNoAccess, setShowNoAccess] = useState(false);
  const [choosingContext, setChoosingContext] = useState(false);

  useEffect(() => {
    if (auth.loading || !auth.isAuthenticated || auth.activeContext != null || auth.availableContexts.length > 0) {
      setShowNoAccess(false);
      return;
    }

    const timer = window.setTimeout(() => setShowNoAccess(true), 1600);
    return () => window.clearTimeout(timer);
  }, [auth.activeContext, auth.availableContexts.length, auth.isAuthenticated, auth.loading]);

  if (auth.loading) {
    return <AuthTransitionScreen />;
  }
  if (!auth.isAuthenticated) return <main className="content">Please sign in again.</main>;
  if (choosingContext) {
    return (
      <AuthTransitionScreen
        title="Switching workspace"
        message="Applying your selected access context and opening the right dashboard."
      />
    );
  }
  if (auth.activeContext != null) {
    return <Navigate to={getDashboardPathForActiveContext(auth.activeContext)} replace />;
  }
  if (auth.availableContexts.length === 0 && !showNoAccess) {
    return (
      <AuthTransitionScreen
        title="Loading access context"
        message="Fetching active assignments and preparing the correct dashboard."
      />
    );
  }

  async function choose(assignmentId: string) {
    setChoosingContext(true);
    const selectedSummary = auth.availableContexts.find((context) => context.assignment_id === assignmentId);
    const startedAt = Date.now();
    try {
      await auth.selectContext(assignmentId);
      const remainingDelay = Math.max(0, 900 - (Date.now() - startedAt));
      if (remainingDelay > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
      }
      navigate(getDashboardPathForContext(selectedSummary));
    } finally {
      setChoosingContext(false);
    }
  }

  return (
    <main className="auth-page">
      <section>
        <p className="eyebrow">Access context</p>
        <h1>Select how you want to continue</h1>
        <p>Only backend-provided active assignments can be selected.</p>
      </section>
      <section className="portal-grid">
        {auth.availableContexts.map((context) => (
          <button className="portal-card" key={context.assignment_id} type="button" onClick={() => void choose(context.assignment_id)}>
            <span>{context.role.label}</span>
            <small>{context.tenant?.name ?? "Ottobon Platform"}</small>
            <small>{context.branch?.name}</small>
          </button>
        ))}
        {auth.availableContexts.length === 0 && (
          <div className="portal-card">
            <span>Application access not configured</span>
            <small>Contact the institution administrator or Ottobon support.</small>
          </div>
        )}
      </section>
    </main>
  );
}
