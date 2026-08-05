import { useAuth } from "../../authentication/providers/AuthProvider";

export function DashboardShellPage() {
  const auth = useAuth();
  const role = auth.activeContext?.role_codes[0] ?? "USER";
  return (
    <section>
      <p className="eyebrow">Dashboard</p>
      <h1>{role.replaceAll("_", " ")}</h1>
      <p>This dashboard shell is ready for the next implementation phase.</p>
    </section>
  );
}
