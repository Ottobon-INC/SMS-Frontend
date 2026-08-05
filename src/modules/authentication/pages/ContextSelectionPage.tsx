import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { getDashboardPathForContext } from "../utils/routing";

export function ContextSelectionPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.loading) return <main className="content">Loading authentication...</main>;
  if (!auth.isAuthenticated) return <main className="content">Please sign in again.</main>;

  async function choose(assignmentId: string) {
    await auth.selectContext(assignmentId);
    navigate(getDashboardPathForContext(auth.availableContexts.find((context) => context.assignment_id === assignmentId)));
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
