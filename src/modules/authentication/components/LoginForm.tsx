import { useState } from "react";
import { Link } from "react-router-dom";
import type { PortalKey } from "../types/authContext.types";

export function LoginForm({
  portal,
  onSubmit,
  error
}: {
  portal: PortalKey;
  onSubmit: (loginIdentifier: string, password: string) => Promise<void>;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <label>
        Username or email
        <input
          autoComplete="username"
          disabled={submitting}
          onChange={(event) => setEmail(event.target.value)}
          required
          type="text"
          value={email}
        />
      </label>
      <label>
        Password
        <span className="password-row">
          <input
            autoComplete="current-password"
            disabled={submitting}
            onChange={(event) => setPassword(event.target.value)}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      {error != null && <div className="form-error">{error}</div>}
      <button disabled={submitting} type="submit">
        {submitting ? "Signing in..." : "Sign in"}
      </button>
      <Link to="/">Back to portal selection</Link>
      <Link to={`/signup?portal=${portal}`}>Request an account</Link>
      <span className="muted">Password recovery will be configured during credential lifecycle implementation.</span>
      <input type="hidden" name="portal" value={portal} />
    </form>
  );
}
