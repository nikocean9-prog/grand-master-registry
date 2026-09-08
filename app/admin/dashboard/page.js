"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [traffic, setTraffic] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficError, setTrafficError] = useState("");

  async function loadTraffic() {
    setTrafficLoading(true);
    setTrafficError("");

    const { data, error } = await supabase.rpc("get_owner_traffic_summary", {
      p_days: 30,
    });

    if (error) {
      console.error("Traffic summary failed:", error);
      setTrafficError("Traffic figures could not be loaded. Please try again.");
    } else {
      setTraffic(data);
    }

    setTrafficLoading(false);
  }

  useEffect(() => {
    async function checkAdmin() {
      const { data: assurance } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

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
        window.location.href = "/admin?reason=session";
        return;
      }

      setIsOwner(admin.isOwner);
      setLoading(false);
      if (admin.isOwner) loadTraffic();
    }

    checkAdmin();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  if (loading) {
    return (
      <main>
        <h1>Admin Home</h1>
        <p>Loading...</p>
      </main>
    );
  }

  const linkStyle = {
    display: "block",
    border: "1px solid #ccc",
    padding: "20px",
    marginBottom: "16px",
    textDecoration: "none",
    color: "inherit",
  };

  return (
    <main>
      <h1>{isOwner ? "Owner Dashboard" : "Admin Home"}</h1>
      <p>Manage registry submissions and review previous decisions.</p>

      {isOwner && (
        <section className="traffic-panel" aria-labelledby="traffic-heading">
          <div className="traffic-heading">
            <div>
              <p className="traffic-eyebrow">SITE TRAFFIC</p>
              <h2 id="traffic-heading">Visitor overview</h2>
              <p>Anonymous counts update as people browse. Your signed-in owner visits are excluded. Reporting timezone: UTC.</p>
            </div>
            <button type="button" onClick={loadTraffic} disabled={trafficLoading}>
              {trafficLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {trafficError && <p className="traffic-error">{trafficError}</p>}

          {traffic ? (
            <>
              <div className="traffic-stats">
                <div><span>Today</span><strong>{traffic.today_visitors ?? 0}</strong><small>unique visitors</small></div>
                <div><span>Last 7 days</span><strong>{traffic.week_visitors ?? 0}</strong><small>unique visitors</small></div>
                <div><span>Today</span><strong>{traffic.today_views ?? 0}</strong><small>page views</small></div>
                <div><span>Last 7 days</span><strong>{traffic.week_views ?? 0}</strong><small>page views</small></div>
              </div>

              <div className="traffic-details">
                <div>
                  <h3>Last 14 days</h3>
                  <div className="traffic-table-wrap">
                    <table className="traffic-table">
                      <thead><tr><th>Date</th><th>Visitors</th><th>Views</th></tr></thead>
                      <tbody>
                        {(traffic.daily || []).slice(-14).reverse().map((day) => (
                          <tr key={day.day}>
                            <td>{day.day}</td><td>{day.visitors}</td><td>{day.views}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3>Top pages · 7 days</h3>
                  {(traffic.top_pages || []).length ? (
                    <ol className="traffic-pages">
                      {traffic.top_pages.map((page) => (
                        <li key={page.path}>
                          <span>{page.path}</span>
                          <strong>{page.views} views</strong>
                        </li>
                      ))}
                    </ol>
                  ) : <p>No public page views have been recorded yet.</p>}

                  <h3 className="traffic-subheading">Traffic sources · 7 days</h3>
                  {(traffic.top_referrers || []).length ? (
                    <ol className="traffic-pages">
                      {traffic.top_referrers.map((source) => (
                        <li key={source.source}>
                          <span>{source.source}</span>
                          <strong>{source.visitors} visitors</strong>
                        </li>
                      ))}
                    </ol>
                  ) : <p>No referral information has been recorded yet.</p>}
                </div>
              </div>

              <div className="submission-attribution">
                <h3>Submission sources</h3>
                <div>
                  <span><strong>{traffic.submissions?.public_submissions ?? 0}</strong> public uploads</span>
                  <span><strong>{traffic.submissions?.public_submitters ?? 0}</strong> anonymous public submitters</span>
                  <span><strong>{traffic.submissions?.owner_submissions ?? 0}</strong> owner uploads</span>
                  <span><strong>{traffic.submissions?.codex_submissions ?? 0}</strong> Codex-assisted</span>
                  {(traffic.submissions?.unknown_submissions ?? 0) > 0 && (
                    <span><strong>{traffic.submissions.unknown_submissions}</strong> older unclassified</span>
                  )}
                </div>
              </div>
            </>
          ) : trafficLoading ? <p>Loading traffic figures…</p> : null}
        </section>
      )}

      <div style={{ maxWidth: "600px", marginTop: "25px" }}>
        <Link href="/admin/approvals" style={linkStyle}>
          <strong>Pending Approvals</strong>
          <div>Review, approve or reject new submissions.</div>
        </Link>

        <Link href="/admin/history" style={linkStyle}>
          <strong>Submission History</strong>
          <div>View all approved and rejected submissions.</div>
        </Link>

        {isOwner && (
          <>
            <Link href="/admin/bulk-upload" style={linkStyle}>
              <strong>Bulk Upload</strong>
              <div>Upload multiple pull photos for background assessment.</div>
            </Link>

            <Link href="/admin/operations" style={linkStyle}>
              <strong>Owner Operations</strong>
              <div>Manage discoveries, content drafts and automated work.</div>
            </Link>
          </>
        )}

        <Link href="/admin/security" style={linkStyle}>
          <strong>Admin Security</strong>
          <div>Set up or check Google Authenticator protection.</div>
        </Link>

        <Link href="/" style={linkStyle}>
          <strong>View Public Registry</strong>
          <div>Open the public-facing registry.</div>
        </Link>
      </div>

      <button type="button" onClick={handleSignOut}>Sign Out</button>
    </main>
  );
}
