"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminMfaPage() {
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadChallenge() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/admin";
        return;
      }

      const { data: assurance } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assurance?.currentLevel === "aal2") {
        window.location.href = "/admin/dashboard";
        return;
      }

      const { data, error } = await supabase.auth.mfa.listFactors();
      const factor = (data?.totp || []).find(
        (item) => item.status === "verified"
      );

      if (error || !factor) {
        const admin = await getCurrentAdmin(supabase);

        if (!admin) {
          await supabase.auth.signOut();
          window.location.href = "/admin";
          return;
        }

        window.location.href = "/admin/security";
        return;
      }

      setFactorId(factor.id);
      setLoading(false);
    }

    loadChallenge();
  }, []);

  async function verifyCode(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const challenge = await supabase.auth.mfa.challenge({ factorId });

    if (challenge.error) {
      setMessage(`Could not start verification: ${challenge.error.message}`);
      setBusy(false);
      return;
    }

    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });

    if (verify.error) {
      setMessage("That code was not accepted. Wait for a new code and try again.");
      setBusy(false);
      return;
    }

    const admin = await getCurrentAdmin(supabase);

    if (!admin) {
      await supabase.auth.signOut();
      setMessage("This account does not have administrator access.");
      setBusy(false);
      return;
    }

    window.location.href = "/admin/dashboard";
  }

  if (loading) {
    return (
      <main>
        <h1>Authenticator Verification</h1>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Authenticator Verification</h1>
      <p>Enter the current six-digit code from Google Authenticator.</p>

      <form onSubmit={verifyCode}>
        <label htmlFor="mfa-code">Six-digit code</label>
        <br />
        <input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength="6"
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          autoFocus
          required
        />
        <br />
        <button type="submit" disabled={busy || code.length !== 6}>
          {busy ? "Verifying..." : "Verify and Continue"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  );
}
