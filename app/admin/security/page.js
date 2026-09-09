"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadSecurity() {
      const admin = await getCurrentAdmin(supabase);

      if (!admin) {
        await supabase.auth.signOut();
        window.location.href = "/admin";
        return;
      }

      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        setMessage("Could not load authenticator settings.");
      } else {
        setEnabled(
          (data?.totp || []).some((factor) => factor.status === "verified")
        );
      }

      setLoading(false);
    }

    loadSecurity();
  }, []);

  async function startSetup() {
    setBusy(true);
    setMessage("");

    const { data: factors } = await supabase.auth.mfa.listFactors();

    for (const factor of factors?.all || []) {
      if (factor.factor_type === "totp" && factor.status !== "verified") {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "TCG Serial Tracker",
    });

    if (error) {
      setMessage("Authenticator setup could not start. Check your connection and try again.");
      setBusy(false);
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setBusy(false);
  }

  async function verifySetup(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const challenge = await supabase.auth.mfa.challenge({ factorId });

    if (challenge.error) {
      setMessage("Authenticator verification could not start. Check your connection and try again.");
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

    setEnabled(true);
    setFactorId("");
    setQrCode("");
    setSecret("");
    setCode("");
    setMessage("Google Authenticator is now enabled.");
    setBusy(false);
  }

  if (loading) {
    return (
      <main>
        <h1>Admin Security</h1>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main>
      <Link href="/admin/dashboard">← Back to Admin Home</Link>
      <h1>Admin Security</h1>

      {enabled ? (
        <div>
          <h2>Google Authenticator is enabled</h2>
          <p>
            Your admin account now requires a six-digit authenticator code
            after your password.
          </p>
          <p>
            Keep access to your authenticator. Supabase does not issue recovery
            codes.
          </p>
        </div>
      ) : qrCode ? (
        <div>
          <h2>Scan this QR code</h2>
          <ol>
            <li>Open Google Authenticator on your phone.</li>
            <li>Press the + button and choose Scan a QR code.</li>
            <li>Scan the code below.</li>
            <li>Enter the six-digit code to finish setup.</li>
          </ol>

          <img
            src={qrCode}
            alt="Google Authenticator setup QR code"
            style={{ width: "240px", maxWidth: "100%", background: "white" }}
          />

          <details style={{ marginTop: "16px" }}>
            <summary>Cannot scan the QR code?</summary>
            <p>Enter this setup key manually in Google Authenticator:</p>
            <code style={{ wordBreak: "break-all" }}>{secret}</code>
          </details>

          <form onSubmit={verifySetup} style={{ marginTop: "20px" }}>
            <label htmlFor="authenticator-code">Six-digit code</label>
            <br />
            <input
              id="authenticator-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength="6"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
            />
            <br />
            <button type="submit" disabled={busy || code.length !== 6}>
              {busy ? "Verifying..." : "Enable Authenticator"}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2>Protect your admin account</h2>
          <p>
            Google Authenticator adds a second check after your password and
            protects approvals, edits, removals and restores.
          </p>
          <button type="button" onClick={startSetup} disabled={busy}>
            {busy ? "Preparing..." : "Set Up Google Authenticator"}
          </button>
        </div>
      )}

      {message && <p>{message}</p>}
    </main>
  );
}
