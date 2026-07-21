import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "user@gamematcher.gg", password: "Password123!" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(form);
      const next = (location.state as { from?: string } | undefined)?.from ?? "/dashboard";
      navigate(next);
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 540 }}>
      <section className="panel page-stack">
        <div>
          <span className="eyebrow">Welcome back</span>
          <h1>Login</h1>
          <p className="kicker">Use the seeded demo account or sign in with a registered profile.</p>
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <label className="label">Email<input className="input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="label">Password<input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          {error && <div className="error-text">{error}</div>}
          <button className="button" disabled={submitting}>{submitting ? "Signing in..." : "Login"}</button>
        </form>
        <div className="kicker">Need an account? <Link className="link-inline" to="/register">Create one</Link></div>
      </section>
    </div>
  );
}
