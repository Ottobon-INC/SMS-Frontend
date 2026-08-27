import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { getDashboardPathForActiveContext, getDashboardPathForContext } from "../utils/routing";
import { dashboardApi } from "../../dashboard/api/dashboardApi";

function warmDashboardForContext(role: string | undefined) {
  if (role === "INSTITUTION_ADMIN") {
    void dashboardApi.warmInstitutionDashboard();
  } else if (role === "BRANCH_ADMIN" || role === "OFFICE_STAFF") {
    void dashboardApi.warmOfficeStaffDashboard();
  }
}

export function ContextSelectionPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [refreshingContext, setRefreshingContext] = useState(false);
  const [choosingContext, setChoosingContext] = useState(false);

  useEffect(() => {
    if (auth.loading || !auth.isAuthenticated || auth.contextResolved || refreshingContext) {
      return;
    }

    let cancelled = false;
    setRefreshingContext(true);
    auth.refreshApplicationContext()
      .catch(() => {
        if (!cancelled) {
          void auth.logout();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRefreshingContext(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [auth, auth.contextResolved, auth.isAuthenticated, auth.loading, refreshingContext]);

  if (auth.loading || refreshingContext || !auth.contextResolved) {
    return null;
  }
  if (!auth.isAuthenticated) return <main className="content">Please sign in again.</main>;
  if (auth.activeContext != null) {
    return <Navigate to={getDashboardPathForActiveContext(auth.activeContext)} replace />;
  }
  async function choose(assignmentId: string) {
    const selectedSummary = auth.availableContexts.find((context) => context.assignment_id === assignmentId);
    try {
      await auth.selectContext(assignmentId);
      setChoosingContext(true);
      warmDashboardForContext(selectedSummary?.role.code);
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
          <button
            className="portal-card"
            disabled={choosingContext}
            key={context.assignment_id}
            type="button"
            onClick={() => void choose(context.assignment_id)}
          >
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
