import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  LayoutDashboard,
  School,
  UsersRound
} from "lucide-react";
import type { ComponentType } from "react";
import type { PortalKey } from "../types/authContext.types";

const institutionPortals = ["institution", "branch", "office", "parent"] as const;

const portalCards: Record<
  (typeof institutionPortals)[number],
  {
    title: string;
    scope: string;
    description: string;
    icon: ComponentType<{ size?: number; strokeWidth?: number }>;
    tone: "cyan" | "blue" | "teal" | "amber";
  }
> = {
  institution: {
    title: "Institution Admin",
    scope: "Dean Scope",
    description: "Global oversight, financial health, and multi-branch management.",
    icon: Building2,
    tone: "cyan"
  },
  branch: {
    title: "Campus Principal",
    scope: "Branch Scope",
    description: "Branch-level approvals, attendance finalization, and staff control.",
    icon: School,
    tone: "blue"
  },
  office: {
    title: "Office Staff",
    scope: "Operations",
    description: "Daily operations, fee collection, student uploads, and marks entry.",
    icon: UsersRound,
    tone: "teal"
  },
  parent: {
    title: "Parent Portal",
    scope: "Parent Access",
    description: "Real-time attendance, fee receipts, report cards, and live alerts.",
    icon: UsersRound,
    tone: "amber"
  }
};

function loginPath(portal: PortalKey) {
  return `/login?portal=${portal}`;
}

export function PortalSelectionPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="Student Operations Hub home">
          <span className="landing-brand-mark">
            <GraduationCap size={25} strokeWidth={2.4} />
          </span>
          <span>Student Operations Hub</span>
        </Link>
        <a className="landing-demo-link" href="#portals">
          <span>Live Demo</span>
          <ArrowRight size={18} />
        </a>
      </header>

      <section className="landing-hero">
        <div className="hero-kicker">
          <LayoutDashboard size={18} />
          <span>Next-Generation Education Management</span>
        </div>
        <h1>Manage your entire institution with absolute precision.</h1>
        <p>
          The definitive operating system for intermediate colleges. Unify admissions, fee ledgers, daily attendance,
          and parent communications into one impossibly fast, beautifully designed platform.
        </p>
      </section>

      <section className="portal-showcase" id="portals" aria-labelledby="portal-showcase-title">
        <div className="portal-showcase-heading">
          <h2 id="portal-showcase-title">Experience Every Perspective</h2>
          <p>
            Select a portal below to sign in as a specific role and explore the customized dashboard and workflows
            available to them.
          </p>
        </div>

        <div className="landing-portal-grid" aria-label="Login portal choices">
          {institutionPortals.map((portal) => {
            const card = portalCards[portal];
            const Icon = card.icon;
            return (
              <article className="landing-portal-card" key={portal}>
                <div className="landing-card-topline">
                  <span className={`landing-card-icon landing-card-icon-${card.tone}`}>
                    <Icon size={28} strokeWidth={2.2} />
                  </span>
                  <span className="landing-card-scope">{card.scope}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="landing-card-actions">
                  <Link className="landing-card-button landing-card-button-muted" to={loginPath(portal)}>
                    <span>Open Login Page</span>
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="landing-footer">
        <span>Ottobon Academy</span>
        <span>Secure college operations for every role.</span>
      </footer>
    </main>
  );
}
