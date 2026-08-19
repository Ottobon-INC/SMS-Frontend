import { Link, Outlet, useNavigate } from "react-router-dom";
import { navigationItems } from "../../app/navigation/navigationConfig";
import { useAuth } from "../../modules/authentication/providers/AuthProvider";
import { getDashboardPathForContext } from "../../modules/authentication/utils/routing";
import { GlobalDispatchBanner } from "./GlobalDispatchBanner";

function itemAllowed(
  item: (typeof navigationItems)[number],
  activeContext: ReturnType<typeof useAuth>["activeContext"]
) {
  if (activeContext == null) return false;
  if (!activeContext.enabled_modules.includes(item.module)) return false;
  if (item.contextTypes != null && !item.contextTypes.includes(activeContext.scope_type)) return false;
  if (item.permissions == null || item.permissions.length === 0) return true;
  return item.permissions.some((permission) => activeContext.permissions.includes(permission));
}

export function AppShellLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const visibleItems = navigationItems.filter((item) => itemAllowed(item, auth.activeContext));

  async function handleContextChange(nextAssignmentId: string) {
    await auth.selectContext(nextAssignmentId);
    navigate(getDashboardPathForContext(auth.availableContexts.find((context) => context.assignment_id === nextAssignmentId)));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <h1>Student Management</h1>
        <div className="context-panel">
          <div className="eyebrow">Signed in</div>
          <strong>{auth.appUser?.display_name}</strong>
          <span>{auth.activeContext?.role_codes.join(", ")}</span>
          <span>{auth.availableContexts.find((context) => context.assignment_id === auth.activeContext?.assignment_id)?.tenant?.name}</span>
          <span>{auth.availableContexts.find((context) => context.assignment_id === auth.activeContext?.assignment_id)?.branch?.name}</span>
          {auth.availableContexts.length > 1 && (
            <select
              aria-label="Switch access context"
              value={auth.activeContext?.assignment_id ?? ""}
              onChange={(event) => void handleContextChange(event.target.value)}
            >
              {auth.availableContexts.map((context) => (
                <option key={context.assignment_id} value={context.assignment_id}>
                  {context.role.label} - {context.branch?.name ?? context.tenant?.name ?? "Platform"}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={() => void auth.logout()}>
            Logout
          </button>
        </div>
        <nav>
          {visibleItems.map((item) => (
            <Link key={item.route} to={item.route}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="content">
        <GlobalDispatchBanner />
        <Outlet />
      </section>
    </main>
  );
}
