import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { PortalKey } from "../types/authContext.types";

export function LoginForm({
  portal,
  onSubmit,
  error,
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
      <div className="auth-form-header">
        <span className="auth-form-badge">Verified access</span>
        <h2>Welcome back</h2>
        <p>
          Use your application credentials to continue into the selected portal.
        </p>
      </div>

      <label className="auth-field">
        <span>Username or email</span>
        <span className="auth-input-wrap">
          <Mail size={18} />
          <input
            autoComplete="username"
            disabled={submitting}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@college.edu"
            required
            type="text"
            value={email}
          />
        </span>
      </label>

      <label className="auth-field">
        <span>Password</span>
        <span className="password-row">
          <span className="auth-input-wrap">
            <KeyRound size={18} />
            <input
              autoComplete="current-password"
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
          </span>
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="auth-icon-button"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {error != null && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <button
        className="auth-submit-button"
        disabled={submitting}
        type="submit"
      >
        {submitting ? (
          <>
            <Loader2 className="auth-spin" size={18} />
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <LogIn size={18} />
          </>
        )}
      </button>

      <div className="auth-secondary-actions">
        <Link to="/">
          <ArrowLeft size={16} />
          Portal selection
        </Link>
      </div>

      <div className="auth-recovery-note">
        Password recovery will be configured during credential lifecycle
        implementation.
      </div>

      <input type="hidden" name="portal" value={portal} />
    </form>
  );
}
