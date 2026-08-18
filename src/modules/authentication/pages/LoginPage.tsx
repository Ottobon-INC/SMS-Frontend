import { useState } from "react";
import {
  Building2,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import { portalDefinitions } from "../constants/portals";
import { useAuth } from "../providers/AuthProvider";
import type { PortalKey } from "../types/authContext.types";
import { getDashboardPathForActiveContext } from "../utils/routing";

const validPortals = new Set<PortalKey>([
  "institution",
  "branch",
  "office",
  "parent",
  "platform",
]);

const portalExperience: Record<
  PortalKey,
  {
    accent: string;
    Icon: typeof Building2;
    promise: string;
    highlights: string[];
    proof: string;
  }
> = {
  institution: {
    accent: "cyan",
    Icon: Building2,
    promise:
      "Sign in to manage branches, users, academic setup and institution-level oversight.",
    highlights: ["Branches", "Users", "Academic setup", "Consolidated reports"],
    proof: "Tenant-scoped governance",
  },
  branch: {
    accent: "blue",
    Icon: GraduationCap,
    promise:
      "Sign in to supervise campus approvals, attendance, fees and examination publishing.",
    highlights: [
      "Branch approvals",
      "Attendance finalization",
      "Fee oversight",
      "Exam publishing",
    ],
    proof: "Branch-scoped authority",
  },
  office: {
    accent: "teal",
    Icon: Users,
    promise:
      "Sign in to handle student records, imports, fees, attendance and marks entry.",
    highlights: [
      "Student records",
      "Bulk imports",
      "Fee posting",
      "Attendance entry",
    ],
    proof: "Operational workspace",
  },
  parent: {
    accent: "amber",
    Icon: ShieldCheck,
    promise:
      "Sign in to view approved attendance, fee, result and notification information.",
    highlights: ["Attendance", "Fees", "Results", "Notifications"],
    proof: "Family-bound access",
  },
  platform: {
    accent: "violet",
    Icon: LockKeyhole,
    promise:
      "Sign in to manage platform operations, subscriptions and controlled support access.",
    highlights: [
      "Tenant lifecycle",
      "Subscriptions",
      "System health",
      "Support access",
    ],
    proof: "Platform boundary",
  },
};

export function LoginPage({ platform = false }: { platform?: boolean }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const portal = platform
    ? "platform"
    : ((params.get("portal") ?? "institution") as PortalKey);

  if (!validPortals.has(portal)) return <Navigate to="/" replace />;
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

  const experience = portalExperience[portal];
  const PortalIcon = experience.Icon;

  return (
    <main className={`auth-page auth-page-${experience.accent}`}>
      <section className="auth-hero-panel" aria-labelledby="auth-title">
        <div className="auth-brand-row">
          <span className="auth-brand-mark">
            <PortalIcon size={24} strokeWidth={2.2} />
          </span>
          <span>Student Operations Hub</span>
        </div>

        <div className="auth-copy">
          <p className="auth-kicker">
            <ShieldCheck size={16} />
            Authorized sign in
          </p>
          <h1 id="auth-title">{definition.label}</h1>
          <p className="auth-lead">{experience.promise}</p>
          <p className="auth-muted">
            Portal choice controls destination and messaging only. Assigned
            roles, tenant scope, branch scope, permissions and module access are
            verified by the backend.
          </p>
        </div>

        <div
          className="auth-highlight-grid"
          aria-label={`${definition.label} portal capabilities`}
        >
          {experience.highlights.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <div className="auth-security-note">
          <ShieldCheck size={18} />
          <span>{experience.proof}</span>
        </div>
      </section>
      <LoginForm portal={portal} onSubmit={handleSubmit} error={error} />
    </main>
  );
}
