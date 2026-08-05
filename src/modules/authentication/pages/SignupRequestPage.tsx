import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { submitSignupRequest } from "../api/authClient";
import { portalDefinitions } from "../constants/portals";
import type { PortalKey } from "../types/authContext.types";

const validPortals = new Set<PortalKey>(["institution", "branch", "office", "parent", "platform"]);

export function SignupRequestPage() {
  const [params] = useSearchParams();
  const portal = (params.get("portal") ?? "institution") as PortalKey;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!validPortals.has(portal)) return <Navigate to="/" replace />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    setError(null);
    try {
      const response = await submitSignupRequest({
        requested_portal: portal,
        full_name: fullName,
        email,
        mobile,
        institution_name: institutionName,
        branch_name: branchName,
        message
      });
      setStatus(`Request ${response.request_id} submitted with status ${response.status}.`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Signup request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section>
        <p className="eyebrow">Account request</p>
        <h1>{portalDefinitions[portal].label}</h1>
        <p>Request access for this portal. Account requests do not grant roles automatically.</p>
      </section>
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label>
          Full name
          <input required value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <label>
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Mobile
          <input value={mobile} onChange={(event) => setMobile(event.target.value)} />
        </label>
        <label>
          Institution
          <input value={institutionName} onChange={(event) => setInstitutionName(event.target.value)} />
        </label>
        <label>
          Branch
          <input value={branchName} onChange={(event) => setBranchName(event.target.value)} />
        </label>
        <label>
          Message
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        {status != null && <div className="form-success">{status}</div>}
        {error != null && <div className="form-error">{error}</div>}
        <button disabled={submitting} type="submit">
          {submitting ? "Submitting..." : "Request access"}
        </button>
        <Link to={`/login?portal=${portal}`}>Back to sign in</Link>
      </form>
    </main>
  );
}
