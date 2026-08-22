import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-treasury-ink px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-full bg-treasury-gold flex items-center justify-center text-treasury-ink font-bold text-lg mb-3">
            NT
          </div>
          <h1 className="text-white text-lg font-semibold text-center">The National Treasury</h1>
          <p className="text-white/60 text-sm text-center">Asset Inventory System</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <p className="text-sm text-treasury-red bg-treasury-red/10 rounded-md px-3 py-2">{error}</p>
          )}
          <div>
            <label className="label">Username</label>
            <input
              className="input-field"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input-field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button disabled={submitting} className="btn-primary w-full justify-center flex">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-2 flex justify-center">
          <div className="h-1 w-24 flex rounded-full overflow-hidden">
            <span className="flex-1 bg-white/40" />
            <span className="flex-1 bg-treasury-red" />
            <span className="flex-1 bg-treasury-green" />
          </div>
        </div>
      </div>
    </div>
  );
}
