import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { navigationItems } from "../../app/navigation/navigationConfig";
import { useAuth } from "../../modules/authentication/providers/AuthProvider";
import { getDashboardPathForContext } from "../../modules/authentication/utils/routing";
import {
  LayoutDashboard, ShieldAlert, Building2, GitBranch, Users, GraduationCap,
  UserRoundCheck, FileUp, Banknote, CalendarCheck, FileText, Bell, BarChart3,
  FileClock, LifeBuoy, LogOut, School, MessageSquare, Menu, X, ChevronRight,
  MoreHorizontal
} from "lucide-react";
import React, { useState, useEffect } from "react";
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
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => typeof window !== "undefined" && window.innerWidth < 1024);

  const visibleItems = navigationItems.filter((item) => itemAllowed(item, auth.activeContext));

  useEffect(() => {
    const handleResize = () => {
      const mobileOrTablet = window.innerWidth < 1024;
      setIsMobileOrTablet(mobileOrTablet);
      if (!mobileOrTablet) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleContextChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    await auth.selectContext(id);
    navigate(getDashboardPathForContext(auth.availableContexts.find((c) => c.assignment_id === id)));
  }

  const initials = auth.appUser?.display_name?.slice(0, 2).toUpperCase() ?? "US";
  const activeCtx = auth.availableContexts.find((c) => c.assignment_id === auth.activeContext?.assignment_id);
  const locationLabel = activeCtx?.branch?.name ?? activeCtx?.tenant?.name ?? "Platform";

  const itemPx = expanded ? 10 : 0;
  const iconSize = 17;

  // Primary 4 tabs for Mobile/Tablet Bottom Navigation Bar + 5th "More" tab
  const bottomTabs = [
    { label: "Dashboard", route: "/", icon: LayoutDashboard, module: "dashboard" },
    { label: "Attendance", route: "/attendance", icon: CalendarCheck, module: "attendance" },
    { label: "Fees", route: "/fees", icon: Banknote, module: "fees" },
    { label: "Exams", route: "/examinations", icon: FileText, module: "examinations" },
  ].filter((t) => {
    const navItem = navigationItems.find((n) => n.route === t.route);
    return navItem ? itemAllowed(navItem, auth.activeContext) : true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#0d1117" }}>

      {/* ─── Row 1: Mobile & Tablet Top Header Bar (< 1024px) ─── */}
      {isMobileOrTablet && (
        <header
          style={{
            height: 54,
            flexShrink: 0,
            zIndex: 40,
            background: "#0d1117",
            borderBottom: "1px solid #21262d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1f6feb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <School size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3", lineHeight: "16px" }}>Student Management</p>
              <p style={{ fontSize: 10, color: "#8b949e", lineHeight: "12px" }}>{locationLabel}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, background: "#1f6feb",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: "#fff",
            }}>
              {initials}
            </div>
          </div>
        </header>
      )}

      {/* ─── Row 2: Middle Content Area (Sidebar + Main) ─── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
        
        {/* Mobile Slide-Over Drawer Overlay Backdrop (< 1024px) */}
        {isMobileOrTablet && mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 45,
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(3px)",
              transition: "opacity 250ms ease",
            }}
          />
        )}

        {/* Desktop Floating Sidebar (>= 1024px) OR Mobile/Tablet Slide Drawer (< 1024px) */}
        <aside
          onMouseEnter={() => !isMobileOrTablet && setExpanded(true)}
          onMouseLeave={() => !isMobileOrTablet && setExpanded(false)}
          style={{
            position: "fixed",
            top: isMobileOrTablet ? 0 : 10,
            left: isMobileOrTablet ? (mobileMenuOpen ? 0 : -280) : 10,
            bottom: isMobileOrTablet ? 0 : 10,
            width: isMobileOrTablet ? 280 : (expanded ? EXPANDED : COLLAPSED),
            zIndex: 50,
            transition: isMobileOrTablet
              ? `left ${DURATION} ${EASE}`
              : `width ${DURATION} ${EASE}, box-shadow ${DURATION} ${EASE}`,
            background: "#0d1117",
            borderRadius: isMobileOrTablet ? "0 16px 16px 0" : 14,
            border: "1px solid #21262d",
            boxShadow: isMobileOrTablet
              ? "4px 0 24px rgba(0,0,0,0.5)"
              : expanded
                ? "0 12px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)"
                : "0 4px 20px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Brand */}
          <div style={{
            display: "flex", alignItems: "center",
            padding: (isMobileOrTablet || expanded) ? "14px 14px 12px" : "14px 0 12px",
            justifyContent: (isMobileOrTablet || expanded) ? "space-between" : "center",
            borderBottom: "1px solid #21262d",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1f6feb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <School size={15} color="#fff" strokeWidth={2.5} />
              </div>
              <div style={{ 
                opacity: (isMobileOrTablet || expanded) ? 1 : 0, 
                maxWidth: (isMobileOrTablet || expanded) ? 200 : 0,
                transition: `opacity 250ms ease, max-width ${DURATION} ${EASE}`, 
                overflow: "hidden", 
                whiteSpace: "nowrap" 
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3", letterSpacing: "-0.02em", lineHeight: "17px" }}>Student Management</p>
                <p style={{ fontSize: 10, color: "#484f58", lineHeight: "14px", marginTop: 1 }}>School Portal</p>
              </div>
            </div>

            {isMobileOrTablet && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "transparent", border: "none", color: "#8b949e", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* User row */}
          <div style={{
            padding: (isMobileOrTablet || expanded) ? "10px 10px 8px" : "8px 0 6px",
            flexShrink: 0,
          }}>
            <div style={{
              display: "flex", alignItems: "center", 
              gap: (isMobileOrTablet || expanded) ? 10 : 0,
              padding: (isMobileOrTablet || expanded) ? "8px 10px" : "6px 0",
              justifyContent: (isMobileOrTablet || expanded) ? "flex-start" : "center",
              borderRadius: 8,
              background: (isMobileOrTablet || expanded) ? "#161b22" : "transparent",
              border: (isMobileOrTablet || expanded) ? "1px solid #30363d" : "none",
              overflow: "hidden",
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
                opacity: (isMobileOrTablet || expanded) ? 1 : 0, 
                maxWidth: (isMobileOrTablet || expanded) ? 200 : 0,
                transition: `opacity 250ms ease, max-width ${DURATION} ${EASE}`, 
                overflow: "hidden", 
                whiteSpace: "nowrap", 
                minWidth: 0, 
                flex: (isMobileOrTablet || expanded) ? 1 : "none" 
              }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "#e6edf3", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "17px" }}>
                  {auth.appUser?.display_name}
                </p>
                <p style={{ fontSize: 10.5, color: "#6e7681", lineHeight: "14px", marginTop: 1 }}>{locationLabel}</p>
              </div>
            </div>

            {/* Context switcher */}
            {auth.availableContexts.length > 1 && (
              <div style={{
                maxHeight: (isMobileOrTablet || expanded) ? 44 : 0,
                opacity: (isMobileOrTablet || expanded) ? 1 : 0,
                overflow: "hidden",
                transition: `max-height ${DURATION} ${EASE}, opacity 250ms ease`,
                marginTop: (isMobileOrTablet || expanded) ? 6 : 0,
              }}>
                <div style={{ position: "relative" }}>
                  <select
                    aria-label="Switch context"
                    value={auth.activeContext?.assignment_id ?? ""}
                    onChange={handleContextChange}
                    style={{ width: "100%", appearance: "none", background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, color: "#8b949e", fontSize: 11, fontWeight: 500, padding: "6px 22px 6px 10px", cursor: "pointer", outline: "none" }}
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

          {/* Nav items */}
          <nav 
            className="app-sidebar-nav"
            style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "2px 6px", scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`
              .app-sidebar-nav::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <p style={{
              fontSize: 9.5, fontWeight: 600, color: "#484f58", letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "6px 6px 4px",
              opacity: (isMobileOrTablet || expanded) ? 1 : 0,
              transition: "opacity 250ms ease",
              overflow: "hidden", whiteSpace: "nowrap",
            }}>Menu</p>

            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: isMobileOrTablet ? 4 : 1 }}>
              {visibleItems.map((item) => {
                const Icon = ROUTE_ICONS[item.route] ?? MODULE_ICONS[item.module] ?? LayoutDashboard;
                return (
                  <li key={item.route}>
                    <NavLink
                      to={item.route}
                      onClick={() => isMobileOrTablet && setMobileMenuOpen(false)}
                      title={(!expanded && !isMobileOrTablet) ? item.label : undefined}
                      style={({ isActive }) => ({
                        ...railItem,
                        padding: (isMobileOrTablet || expanded) ? `9px ${isMobileOrTablet ? 12 : itemPx}px` : "8px 0",
                        justifyContent: (isMobileOrTablet || expanded) ? "flex-start" : "center",
                        gap: (isMobileOrTablet || expanded) ? 10 : 0,
                        color: isActive ? "#58a6ff" : "#8b949e",
                        fontWeight: isActive ? 500 : 400,
                        fontSize: 13.5,
                        lineHeight: "20px",
                        letterSpacing: "-0.01em",
                        background: isActive ? "rgba(31,111,235,0.12)" : "transparent",
                        borderLeft: (isActive && (expanded || isMobileOrTablet)) ? "2px solid #388bfd" : "2px solid transparent",
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={iconSize}
                            strokeWidth={isActive ? 2.25 : 1.75}
                            style={{ flexShrink: 0, color: isActive ? "#388bfd" : "#7d8590" }}
                          />
                          <span style={{
                            opacity: (isMobileOrTablet || expanded) ? 1 : 0,
                            maxWidth: (isMobileOrTablet || expanded) ? 200 : 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            transition: `opacity 250ms ease, max-width ${DURATION} ${EASE}`,
                            whiteSpace: "nowrap",
                            display: "block",
                            flex: 1,
                          }}>
                            {item.label}
                          </span>
                          {isMobileOrTablet && <ChevronRight size={14} style={{ color: "#30363d" }} />}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sign out */}
          <div style={{ padding: "8px 8px 14px", borderTop: "1px solid #21262d", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                if (isMobileOrTablet) setMobileMenuOpen(false);
                void auth.logout();
              }}
              title={(!expanded && !isMobileOrTablet) ? "Sign out" : undefined}
              style={{
                ...railItem,
                padding: (isMobileOrTablet || expanded) ? `9px ${isMobileOrTablet ? 12 : itemPx}px` : "8px 0",
                justifyContent: (isMobileOrTablet || expanded) ? "flex-start" : "center",
                gap: (isMobileOrTablet || expanded) ? 10 : 0,
                fontSize: 13.5, fontWeight: 400,
                color: "#8b949e",
                lineHeight: "20px",
                letterSpacing: "-0.01em",
                width: "100%",
                cursor: "pointer",
              }}
            >
              <LogOut size={iconSize} strokeWidth={1.75} style={{ flexShrink: 0, color: "#7d8590" }} />
              <span style={{
                opacity: (isMobileOrTablet || expanded) ? 1 : 0,
                maxWidth: (isMobileOrTablet || expanded) ? 200 : 0,
                overflow: "hidden",
                transition: `opacity 250ms ease, max-width ${DURATION} ${EASE}`,
                whiteSpace: "nowrap",
                display: "block",
              }}>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main content scroll container (Physically bounded between top header and bottom dock!) */}
        <main
          className="px-4 sm:px-6 py-4"
          style={{
            flex: 1,
            minWidth: 0,
            marginLeft: isMobileOrTablet ? 0 : (expanded ? EXPANDED : COLLAPSED) + 20,
            overflowY: "auto",
            background: "#f8fafc",
            paddingBottom: isMobileOrTablet ? 24 : 0,
          }}
        >
          <GlobalDispatchBanner />
          <Outlet />
        </main>
      </div>

      {/* ─── Row 3: Mobile & Tablet Bottom Navigation Dock (< 1024px) ─── */}
      {isMobileOrTablet && (
        <nav
          style={{
            height: 60,
            flexShrink: 0,
            zIndex: 40,
            background: "#0d1117",
            borderTop: "1px solid #21262d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "0 4px",
          }}
        >
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.route;
            return (
              <button
                key={tab.route}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(tab.route);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  height: "100%",
                  border: "none",
                  background: "transparent",
                  color: isActive ? "#388bfd" : "#8b949e",
                  cursor: "pointer",
                  padding: "4px 0",
                  gap: 3,
                  transition: "color 200ms ease",
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: "-0.01em" }}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: "More" Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              height: "100%",
              border: "none",
              background: "transparent",
              color: mobileMenuOpen ? "#388bfd" : "#8b949e",
              cursor: "pointer",
              padding: "4px 0",
              gap: 3,
              transition: "color 200ms ease",
            }}
          >
            <MoreHorizontal size={20} strokeWidth={mobileMenuOpen ? 2.25 : 1.75} />
            <span style={{ fontSize: 10, fontWeight: mobileMenuOpen ? 700 : 500, letterSpacing: "-0.01em" }}>
              More
            </span>
          </button>
        </nav>
      )}
    </div>
  );
}
