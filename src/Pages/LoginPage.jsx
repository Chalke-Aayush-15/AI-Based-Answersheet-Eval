import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import "./AuthPage.module.css";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Background grid */}
      <div className="login-bg">
        <div className="bg-grid" />
        <div className="bg-glow" />
      </div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-bracket">[</span>
            <span className="logo-text">AI</span>
            <span className="logo-bracket">]</span>
          </div>
          <h1 className="login-title">Answer Sheet Evaluator</h1>
          <p className="login-subtitle">Teacher Portal</p>
        </div>

        {/* Tab switch */}
        <div className="tab-row">
          <button
            className={`tab-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
            type="button"
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Dr. Anita Sharma"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="teacher@university.edu"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
              value={form.password}
              onChange={handleChange}
              required
              minLength={mode === "register" ? 6 : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-spinner" />
            ) : mode === "login" ? (
              "Sign In →"
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        <p className="login-footer">
          Secure access for authorized educators only.
        </p>
      </div>
    </div>
  );
}