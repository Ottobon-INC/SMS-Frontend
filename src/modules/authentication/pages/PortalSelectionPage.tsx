import { Link } from "react-router-dom";
import { portalDefinitions } from "../constants/portals";

const institutionPortals = ["institution", "branch", "office", "parent"] as const;

export function PortalSelectionPage() {
  return (
    <main className="public-page">
      <section className="public-hero">
        <p className="eyebrow">Intermediate College Student Management System</p>
        <h1>One secure portal for college operations and parent access.</h1>
        <p>
          Choose your portal to sign in. Portal choice controls only the destination and messaging; access is granted
          by your assigned roles and permissions after authentication.
        </p>
      </section>
      <section className="portal-grid" aria-label="Login portal choices">
        {institutionPortals.map((portal) => (
          <Link className="portal-card" key={portal} to={`/login?portal=${portal}`}>
            <span>{portalDefinitions[portal].label}</span>
            <small>{portalDefinitions[portal].description}</small>
          </Link>
        ))}
      </section>
      <Link className="platform-link" to="/platform-login">
        Ottobon platform administration
      </Link>
    </main>
  );
}
