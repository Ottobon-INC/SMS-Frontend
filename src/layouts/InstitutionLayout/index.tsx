import { Link, Outlet } from "react-router-dom";

const modules = [
  "dashboard",
  "institution",
  "branches",
  "users",
  "academic-structure",
  "students",
  "imports",
  "fees",
  "attendance",
  "examinations",
  "notifications",
  "reports",
  "audit",
  "support"
];

export function InstitutionLayout() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <h1>Student Management</h1>
        <nav>
          {modules.map((moduleName) => (
            <Link key={moduleName} to={`/${moduleName}`}>
              {moduleName}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="content">
        <Outlet />
      </section>
    </main>
  );
}
