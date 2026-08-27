import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { navigationItems } from "../../app/navigation/navigationConfig";
import { useAuth } from "../../modules/authentication/providers/AuthProvider";
import { getDashboardPathForContext } from "../../modules/authentication/utils/routing";
import {
  LayoutDashboard, ShieldAlert, Building2, GitBranch, Users, GraduationCap,
  UserRoundCheck, FileUp, Banknote, CalendarCheck, FileText, Bell, BarChart3,
  FileClock, LifeBuoy, LogOut, School, MessageSquare,
} from "lucide-react";
import React, { useState } from "react";
import { GlobalDispatchBanner } from "./GlobalDispatchBanner";

function itemAllowed(
  item: (typeof navigationItems)[number],
  activeContext: ReturnType<typeof useAuth>["activeContext"]
) {
  if (activeContext == null) return false;
  if (!activeContext.enabled_modules.includes(item.module)) return false;
  if (item.contextTypes != null && !item.contextTypes.includes(activeContext.scope_type)) return false;
  if (item.permissions == null || item.permissions.length === 0) return true;
  return item.permissions.some((p) => activeContext.permissions.includes(p));
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard, "platform-admin": ShieldAlert,
  institution: Building2, branches: GitBranch, users: Users,
  "academic-structure": GraduationCap, students: UserRoundCheck,
  imports: FileUp, fees: Banknote, attendance: CalendarCheck,
  examinations: FileText, notifications: Bell, reports: BarChart3,
  audit: FileClock, support: LifeBuoy, "parent-portal": Users,
};

const ROUTE_ICONS: Record<string, React.ElementType> = {
  "/whatsapp-simulator": MessageSquare,
};

const COLLAPSED = 56;
const EXPANDED  = 256;
const EASE      = "cubic-bezier(0.25, 1, 0.5, 1)";
const DURATION  = "350ms";

/* shared icon-rail item style */
const railItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  borderRadius: 8,
  cursor: "pointer",
  transition: `background ${DURATION} ${EASE}, color ${DURATION} ${EASE}`,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textDecoration: "none",
  border: "none",
  background: "transparent",
  width: "100%",
};

export function AppShellLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const visibleItems = navigationItems.filter((item) => itemAllowed(item, auth.activeContext));

  async function handleContextChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    await auth.selectContext(id);
    navigate(getDashboardPathForContext(auth.availableContexts.find((c) => c.assignment_id === id)));
  }

  const initials = auth.appUser?.display_name?.slice(0, 2).toUpperCase() ?? "US";
  const activeCtx = auth.availableContexts.find((c) => c.assignment_id === auth.activeContext?.assignment_id);
  const locationLabel = activeCtx?.branch?.name ?? activeCtx?.tenant?.name ?? "Platform";

  // Padding each item gets on left/right when expanded vs collapsed
  const itemPx = expanded ? 10 : 0;
  const iconSize = 17;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#f8fafc" }}>

      {/* ─── Floating Sidebar ─── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        style={{
          position: "fixed",
          top: 10, left: 10, bottom: 10,
          zIndex: 50,
          width: expanded ? EXPANDED : COLLAPSED,
          transition: `width ${DURATION} ${EASE}, box-shadow ${DURATION} ${EASE}`,
          background: "#0d1117",
          borderRadius: 14,
          border: "1px solid #21262d",
          boxShadow: expanded
            ? "0 12px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >

        {/* ── Brand ── */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: expanded ? "14px 12px 12px" : "14px 0 12px",
          justifyContent: expanded ? "flex-start" : "center",
          gap: expanded ? 10 : 0,
          borderBottom: "1px solid #21262d",
          flexShrink: 0,
          transition: `padding ${DURATION} ${EASE}`,
        }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1f6feb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <School size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ 
            opacity: expanded ? 1 : 0, 
            maxWidth: expanded ? 200 : 0,
            transition: `opacity 250ms ease, max-width ${DURATION} ${EASE}`, 
            overflow: "hidden", 
            whiteSpace: "nowrap" 
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3", letterSpacing: "-0.02em", lineHeight: "17px" }}>Student Management</p>
            <p style={{ fontSize: 10, color: "#484f58", lineHeight: "14px", marginTop: 1 }}>School Portal</p>
          </div>
        </div>

        {/* ── User row ── same visual weight as nav icons when collapsed ── */}
        <div style={{
          padding: expanded ? "8px 8px 6px" : "8px 0 6px",
          flexShrink: 0,
          transition: `padding ${DURATION} ${EASE}`,
        }}>
          {/* Collapsed: just avatar centered; Expanded: full card */}
          <div style={{
            display: "flex", alignItems: "center", 
            gap: expanded ? 10 : 0,
            padding: expanded ? "8px 10px" : "6px 0",
            justifyContent: expanded ? "flex-start" : "center",
            borderRadius: 8,
            background: expanded ? "#161b22" : "transparent",
            border: expanded ? "1px solid #30363d" : "none",
            overflow: "hidden",
            transition: `background ${DURATION} ${EASE}, border-color ${DURATION} ${EASE}, padding ${DURATION} ${EASE}`,
          }}>
            <div style={{
              width: 28, height: 28,
              borderRadius: 6,
              background: "#1f6feb",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.05em",
            }}>
              {initials}
            </div>
            <div style={{ 
              opacity: expanded ? 1 : 0, 
              maxWidth: expanded ? 200 : 0,
              transition: `opacity 250ms ease, max-width ${DURATION} ${EASE}`, 
              overflow: "hidden", 
              whiteSpace: "nowrap", 
              minWidth: 0, 
              flex: expanded ? 1 : "none" 
            }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "#e6edf3", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "17px" }}>
                {auth.appUser?.display_name}
              </p>
              <p style={{ fontSize: 10.5, color: "#6e7681", lineHeight: "14px", marginTop: 1 }}>{locationLabel}</p>
            </div>
          </div>

          {/* Context switcher - expanded only */}
          {auth.availableContexts.length > 1 && (
            <div style={{
              maxHeight: expanded ? 44 : 0,
              opacity: expanded ? 1 : 0,
              overflow: "hidden",
              transition: `max-height ${DURATION} ${EASE}, opacity 250ms ease`,
              marginTop: expanded ? 6 : 0,
            }}>
              <div style={{ position: "relative" }}>
                <select
                  aria-label="Switch context"
                  value={auth.activeContext?.assignment_id ?? ""}
                  onChange={handleContextChange}
                  style={{ width: "100%", appearance: "none", background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, color: "#8b949e", fontSize: 11, fontWeight: 500, padding: "5px 22px 5px 10px", cursor: "pointer", outline: "none" }}
                >
                  {auth.availableContexts.map((c) => (
                    <option key={c.assignment_id} value={c.assignment_id} style={{ background: "#0d1117" }}>
                      {c.role.label} - {c.branch?.name ?? c.tenant?.name ?? "Platform"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav 
          className="app-sidebar-nav"
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "2px 6px", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`
            .app-sidebar-nav::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {/* Section label - expanded only */}
          <p style={{
            fontSize: 9.5, fontWeight: 600, color: "#484f58", letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "6px 6px 4px",
            opacity: expanded ? 1 : 0,
            transition: "opacity 250ms ease",
            overflow: "hidden", whiteSpace: "nowrap",
          }}>Menu</p>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {visibleItems.map((item) => {
              const Icon = ROUTE_ICONS[item.route] ?? MODULE_ICONS[item.module] ?? LayoutDashboard;
              return (
                <li key={item.route}>
                  <NavLink
                    to={item.route}
                    title={!expanded ? item.label : undefined}
                    style={({ isActive }) => ({
                      ...railItem,
                      padding: expanded ? `7px ${itemPx}px` : "8px 0",
                      justifyContent: expanded ? "flex-start" : "center",
                      gap: expanded ? 10 : 0,
                      color: isActive ? "#58a6ff" : "#8b949e",
                      fontWeight: isActive ? 500 : 400,
                      fontSize: 13.5,
                      lineHeight: "20px",
                      letterSpacing: "-0.01em",
                      background: isActive ? "rgba(31,111,235,0.12)" : "transparent",
                      borderLeft: (isActive && expanded) ? "2px solid #388bfd" : "2px solid transparent",
                    })}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      if (!el.style.background.includes("0.12")) {
                        el.style.background = "rgba(177,186,196,0.07)";
                        el.style.color = "#c9d1d9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      if (!el.style.background.includes("0.12")) {
                        el.style.background = "transparent";
                        el.style.color = "#8b949e";
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={iconSize}
                          strokeWidth={isActive ? 2.25 : 1.75}
                          style={{ flexShrink: 0, color: isActive ? "#388bfd" : "#7d8590" }}
                        />
                        <span style={{
                          opacity: expanded ? 1 : 0,
                          maxWidth: expanded ? 200 : 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          transition: `opacity 250ms ease, max-width ${DURATION} ${EASE}`,
                          whiteSpace: "nowrap",
                          display: "block",
                        }}>
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Sign out ── */}
        <div style={{ padding: "4px 6px 10px", borderTop: "1px solid #21262d", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => void auth.logout()}
            title={!expanded ? "Sign out" : undefined}
            style={{
              ...railItem,
              padding: expanded ? `7px ${itemPx}px` : "8px 0",
              justifyContent: expanded ? "flex-start" : "center",
              gap: expanded ? 10 : 0,
              fontSize: 13.5, fontWeight: 400,
              color: "#8b949e",
              lineHeight: "20px",
              letterSpacing: "-0.01em",
              width: "100%",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,81,73,0.1)"; e.currentTarget.style.color = "#f85149"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b949e"; }}
          >
            <LogOut size={iconSize} strokeWidth={1.75} style={{ flexShrink: 0, color: "#7d8590" }} />
            <span style={{
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? 200 : 0,
              overflow: "hidden",
              transition: `opacity 250ms ease, max-width ${DURATION} ${EASE}`,
              whiteSpace: "nowrap",
              display: "block",
            }}>Sign out</span>
          </button>
        </div>
      </aside>
      {/* ─── Main content ─── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: (expanded ? EXPANDED : COLLAPSED) + 20,
          transition: `margin-left ${DURATION} ${EASE}`,
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        <GlobalDispatchBanner />
        <Outlet />
      </main>
    </div>
  );
}
