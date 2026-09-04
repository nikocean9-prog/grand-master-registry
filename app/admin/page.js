"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Login failed. Check your email and password.");
      setLoading(false);
      return;
    }

    const { data: assurance, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError) {
      await supabase.auth.signOut();
      setMessage("Could not verify the account security level.");
      setLoading(false);
      return;
    }

    if (
      assurance?.nextLevel === "aal2" &&
      assurance.currentLevel !== "aal2"
    ) {
      window.location.href = "/admin/mfa";
      return;
    }

    const admin = await getCurrentAdmin(supabase);

    if (!admin) {
      await supabase.auth.signOut();
      setMessage("This account does not have administrator access.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin/security";
  }

  return (
    <main>
      <p><a href="/">← Back to Registry</a></p>
      <h1>Admin Login</h1>
      <p>Sign in to review Grand Master Registry submissions.</p>

      <form onSubmit={handleLogin}>
        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  );
}
