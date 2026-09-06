"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const discoveries = [
  {
    id: 1,
    card: "Dark Magical Curtain",
    serial: "007/100",
    source: "Reddit",
    confidence: 94,
    status: "Strong candidate",
    tone: "low",
    found: "Today, 12:02 pm",
    reason: "Card name and serial are visible. Artwork matches the registry reference.",
  },
  {
    id: 2,
    card: "Dark Magician the Pharaoh's Servant",
    serial: "032/100",
    source: "Instagram",
    confidence: 72,
    status: "Needs review",
    tone: "review",
    found: "Today, 12:03 pm",
    reason: "Card appears correct, but glare partially obscures the printed serial.",
  },
  {
    id: 3,
    card: "Dark Magical Curtain",
    serial: "007/100",
    source: "eBay",
    confidence: 100,
    status: "Duplicate",
    tone: "high",
    found: "Today, 12:05 pm",
    reason: "The image matches an existing discovery already awaiting review.",
  },
];

const drafts = [
  {
    id: 1,
    title: "New serial discovered",
    platform: "Instagram + Facebook",
    status: "Awaiting approval",
    scheduled: "Not scheduled",
    copy:
      "A new Dark Magical Curtain serial has been submitted to TCG Serial Tracker. Help the collecting community document the cards that have surfaced.",
  },
  {
    id: 2,
    title: "Weekly registry update",
    platform: "Reddit",
    status: "Draft",
    scheduled: "Friday, 6:00 pm",
    copy:
      "This week’s registry update includes newly documented cards and serials still being searched for by the community.",
  },
];

const jobs = [
  {
    name: "Magnificent Monsters discovery search",
    schedule: "Daily at 12:00 pm",
    lastRun: "Today, 12:00 pm",
    result: "18 sources checked · 2 candidates",
    status: "Ready for connection",
  },
  {
    name: "Daily social post",
    schedule: "Daily at 6:00 pm",
    lastRun: "Not run",
    result: "Waiting for a connected publishing account",
    status: "Not connected",
  },
  {
    name: "Advertising performance report",
    schedule: "Every Monday at 9:00 am",
    lastRun: "Not run",
    result: "Waiting for a connected advertising account",
    status: "Not connected",
  },
];

const tabs = [
  ["overview", "Overview"],
  ["discoveries", "Card Discoveries"],
  ["content", "Content Studio"],
  ["jobs", "Automated Jobs"],
  ["advertising", "Advertising"],
];

function StatusPill({ tone = "neutral", children }) {
  return <span className={`ops-status ops-status-${tone}`}>{children}</span>;
}

export default function OwnerOperations() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedDiscovery, setExpandedDiscovery] = useState(null);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftPlatform, setDraftPlatform] = useState("Instagram + Facebook");
  const [conceptMessage, setConceptMessage] = useState("");

  useEffect(() => {
    async function checkOwner() {
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

      if (!admin.isOwner) {
        window.location.href = "/admin/dashboard";
        return;
      }

      setLoading(false);
    }

    checkOwner();
  }, []);

  const strongCount = useMemo(
    () => discoveries.filter((item) => item.tone === "low").length,
    []
  );

  function demonstrateAction(message) {
    setConceptMessage(message);
    window.setTimeout(() => setConceptMessage(""), 3500);
  }

  function generateDraft(event) {
    event.preventDefault();
    if (!draftPrompt.trim()) {
      setConceptMessage("Add a short instruction before generating a draft.");
      return;
    }
    setConceptMessage(
      `Concept only: a ${draftPlatform} draft would now be generated and saved for approval.`
    );
  }

  if (loading) {
    return (
      <main>
        <h1>Owner Operations</h1>
        <p>Checking owner access...</p>
      </main>
    );
  }

  return (
    <main className="ops-shell">
      <div className="ops-topbar">
        <div>
          <Link href="/admin/dashboard" className="back-link">
            ← Admin Home
          </Link>
          <p className="eyebrow">Owner only</p>
          <h1>Operations Centre</h1>
          <p className="ops-intro">
            Review discoveries, prepare content and control automated work from
            one place.
          </p>
        </div>
        <StatusPill tone="review">Concept mode · No accounts connected</StatusPill>
      </div>

      <nav className="ops-tabs" aria-label="Operations sections">
        {tabs.map(([id, label]) => (
          <button
            type="button"
            key={id}
            className={activeTab === id ? "is-active" : ""}
            onClick={() => {
              setActiveTab(id);
              setConceptMessage("");
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {conceptMessage && (
        <div className="ops-message" role="status">
          {conceptMessage}
        </div>
      )}

      {activeTab === "overview" && (
        <section className="ops-workspace">
          <div className="ops-metrics">
            <button type="button" onClick={() => setActiveTab("discoveries")}>
              <span>Strong discoveries</span>
              <strong>{strongCount}</strong>
              <small>Ready for your review</small>
            </button>
            <button type="button" onClick={() => setActiveTab("content")}>
              <span>Content drafts</span>
              <strong>{drafts.length}</strong>
              <small>1 awaiting approval</small>
            </button>
            <button type="button" onClick={() => setActiveTab("jobs")}>
              <span>Automated jobs</span>
              <strong>{jobs.length}</strong>
              <small>Connections required</small>
            </button>
            <button type="button" onClick={() => setActiveTab("advertising")}>
              <span>Advertising spend</span>
              <strong>$0</strong>
              <small>No campaigns running</small>
            </button>
          </div>

          <div className="ops-grid">
            <article className="ops-panel ops-panel-wide">
              <div className="ops-panel-heading">
                <div>
                  <p className="eyebrow">Owner attention</p>
                  <h2>Items requiring a decision</h2>
                </div>
                <button type="button" onClick={() => setActiveTab("discoveries")}>
                  View discoveries
                </button>
              </div>
              <div className="ops-decision-list">
                <button type="button" onClick={() => setActiveTab("discoveries")}>
                  <StatusPill tone="low">Strong candidate</StatusPill>
                  <span>
                    <strong>Dark Magical Curtain · 007/100</strong>
                    <small>Reddit evidence · 94% confidence</small>
                  </span>
                  <b aria-hidden="true">›</b>
                </button>
                <button type="button" onClick={() => setActiveTab("content")}>
                  <StatusPill tone="review">Draft</StatusPill>
                  <span>
                    <strong>New serial discovered</strong>
                    <small>Instagram + Facebook · Awaiting approval</small>
                  </span>
                  <b aria-hidden="true">›</b>
                </button>
              </div>
            </article>

            <article className="ops-panel">
              <p className="eyebrow">Next run</p>
              <h2>Daily discovery search</h2>
              <p className="ops-run-time">Tomorrow at 12:00 pm</p>
              <p>
                Ten saved card searches will run in order and produce one
                consolidated evidence report.
              </p>
              <button
                type="button"
                onClick={() =>
                  demonstrateAction(
                    "Concept only: this would start the saved discovery search now."
                  )
                }
              >
                Run now
              </button>
            </article>
          </div>
        </section>
      )}

      {activeTab === "discoveries" && (
        <section className="ops-workspace">
          <div className="ops-section-heading">
            <div>
              <p className="eyebrow">Evidence queue</p>
              <h2>Card Discoveries</h2>
              <p>Results remain private until you approve them.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                demonstrateAction(
                  "Concept only: the daily discovery search would start now."
                )
              }
            >
              Run discovery search
            </button>
          </div>

          <div className="ops-filter-row">
            <input aria-label="Search discoveries" placeholder="Search card, serial or source" />
            <select aria-label="Filter discoveries">
              <option>All results</option>
              <option>Strong candidates</option>
              <option>Needs review</option>
              <option>Duplicates</option>
            </select>
            <span>3 results · Page 1 of 1</span>
          </div>

          <div className="ops-discovery-list">
            {discoveries.map((item) => {
              const expanded = expandedDiscovery === item.id;
              return (
                <article key={item.id} className={`ops-discovery ops-tone-${item.tone}`}>
                  <button
                    type="button"
                    className="ops-discovery-summary"
                    aria-expanded={expanded}
                    onClick={() => setExpandedDiscovery(expanded ? null : item.id)}
                  >
                    <span>
                      <strong>{item.card}</strong>
                      <small>{item.serial} · {item.source} · {item.found}</small>
                    </span>
                    <span>
                      <StatusPill tone={item.tone}>{item.status}</StatusPill>
                      <b>{item.confidence}%</b>
                      <i aria-hidden="true">{expanded ? "▲" : "▼"}</i>
                    </span>
                  </button>
                  {expanded && (
                    <div className="ops-discovery-detail">
                      <div className="ops-evidence-placeholder">
                        <span>Evidence preview</span>
                        <small>Source image would load only when expanded</small>
                      </div>
                      <div>
                        <h3>Automated assessment</h3>
                        <p>{item.reason}</p>
                        <dl>
                          <div><dt>Source</dt><dd>{item.source}</dd></div>
                          <div><dt>Card match</dt><dd>{item.confidence}%</dd></div>
                          <div><dt>Existing duplicate</dt><dd>{item.tone === "high" ? "Yes" : "No"}</dd></div>
                        </dl>
                        <div className="ops-actions">
                          <button
                            type="button"
                            onClick={() =>
                              demonstrateAction(
                                "Concept only: this discovery would move into Pending Approvals."
                              )
                            }
                          >
                            Add to Pending Approvals
                          </button>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() =>
                              demonstrateAction(
                                "Concept only: this discovery would be saved for investigation."
                              )
                            }
                          >
                            Investigate
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() =>
                              demonstrateAction(
                                "Concept only: this discovery would be rejected."
                              )
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "content" && (
        <section className="ops-workspace">
          <div className="ops-section-heading">
            <div>
              <p className="eyebrow">Approval workflow</p>
              <h2>Content Studio</h2>
              <p>Request, edit and approve social posts without using the project chat.</p>
            </div>
            <StatusPill>Publishing not connected</StatusPill>
          </div>

          <div className="ops-grid ops-content-grid">
            <form className="ops-panel ops-request-form" onSubmit={generateDraft}>
              <h3>Request a new draft</h3>
              <label>
                Platform
                <select
                  value={draftPlatform}
                  onChange={(event) => setDraftPlatform(event.target.value)}
                >
                  <option>Instagram + Facebook</option>
                  <option>Reddit</option>
                  <option>X / Twitter</option>
                  <option>All connected platforms</option>
                </select>
              </label>
              <label>
                Post type
                <select>
                  <option>New card discovery</option>
                  <option>Registry update</option>
                  <option>Missing card request</option>
                  <option>Educational post</option>
                  <option>Website promotion</option>
                </select>
              </label>
              <label>
                Instructions
                <textarea
                  value={draftPrompt}
                  onChange={(event) => setDraftPrompt(event.target.value)}
                  placeholder="Example: Announce the newly documented card and ask collectors to submit evidence of other serials."
                  rows={5}
                />
              </label>
              <button type="submit">Generate draft</button>
            </form>

            <div className="ops-panel ops-panel-wide">
              <div className="ops-panel-heading">
                <h3>Saved drafts</h3>
                <span>2 items</span>
              </div>
              <div className="ops-draft-list">
                {drafts.map((draft) => (
                  <article key={draft.id}>
                    <div>
                      <StatusPill tone={draft.status === "Draft" ? "neutral" : "review"}>
                        {draft.status}
                      </StatusPill>
                      <h3>{draft.title}</h3>
                      <small>{draft.platform} · {draft.scheduled}</small>
                    </div>
                    <p>{draft.copy}</p>
                    <div className="ops-actions">
                      <button
                        type="button"
                        onClick={() =>
                          demonstrateAction(
                            "Concept only: this post would be approved and ready to schedule."
                          )
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() =>
                          demonstrateAction(
                            "Concept only: this draft would open in the editor."
                          )
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() =>
                          demonstrateAction(
                            "Concept only: another version would be generated."
                          )
                        }
                      >
                        New version
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "jobs" && (
        <section className="ops-workspace">
          <div className="ops-section-heading">
            <div>
              <p className="eyebrow">Schedules and history</p>
              <h2>Automated Jobs</h2>
              <p>See what ran, what it found and what needs attention.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                demonstrateAction(
                  "Concept only: this would open the schedule editor."
                )
              }
            >
              Add scheduled job
            </button>
          </div>

          <div className="ops-job-list">
            {jobs.map((job) => (
              <article key={job.name}>
                <div>
                  <StatusPill tone={job.status === "Ready for connection" ? "review" : "neutral"}>
                    {job.status}
                  </StatusPill>
                  <h3>{job.name}</h3>
                  <p>{job.schedule}</p>
                </div>
                <div>
                  <span>Last run</span>
                  <strong>{job.lastRun}</strong>
                </div>
                <div>
                  <span>Result</span>
                  <strong>{job.result}</strong>
                </div>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() =>
                    demonstrateAction(
                      "Concept only: this would open the job’s run history and settings."
                    )
                  }
                >
                  View details
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "advertising" && (
        <section className="ops-workspace">
          <div className="ops-section-heading">
            <div>
              <p className="eyebrow">Owner approval required</p>
              <h2>Advertising</h2>
              <p>Plan campaigns and control spending before anything goes live.</p>
            </div>
            <StatusPill>Google Ads not connected</StatusPill>
          </div>

          <div className="ops-empty-connected">
            <div className="ops-ad-mark">$</div>
            <h3>No advertising account connected</h3>
            <p>
              When connected, proposed campaigns will be created paused. You will
              approve the audience, wording, daily limit and total budget before
              launch.
            </p>
            <div className="ops-budget-rules">
              <div><span>Default daily limit</span><strong>$20</strong></div>
              <div><span>Automatic budget increases</span><strong>Off</strong></div>
              <div><span>New campaigns</span><strong>Paused</strong></div>
            </div>
            <button
              type="button"
              disabled
              title="Advertising accounts will be connected later"
            >
              Connect advertising account later
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
