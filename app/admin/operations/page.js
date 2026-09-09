"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
    schedule: "Every 4 hours · 6 batches daily",
    lastRun: "Starts after deployment",
    result: "3 cards per batch · all 18 cards daily",
    status: "Scheduled",
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
  ["traffic", "Visitor Overview"],
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
  const [discoveries, setDiscoveries] = useState([]);
  const [discoveryJobs, setDiscoveryJobs] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState("");
  const [runningDiscovery, setRunningDiscovery] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState("");
  const [discoverySearch, setDiscoverySearch] = useState("");
  const [discoveryFilter, setDiscoveryFilter] = useState("active");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftPlatform, setDraftPlatform] = useState("Instagram + Facebook");
  const [conceptMessage, setConceptMessage] = useState("");
  const [traffic, setTraffic] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficError, setTrafficError] = useState("");

  async function loadTraffic() {
    setTrafficLoading(true);
    setTrafficError("");
    const { data, error } = await supabase.rpc("get_owner_traffic_summary", { p_days: 30 });
    if (error) {
      console.error("Traffic summary failed:", error);
      setTrafficError("Traffic figures could not be loaded. Please try again.");
    } else {
      setTraffic(data);
    }
    setTrafficLoading(false);
  }

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

      await Promise.all([loadDiscoveries(), loadDiscoveryJobs(), loadSets(), loadTraffic()]);
      setLoading(false);
    }

    checkOwner();
  }, []);

  useEffect(() => {
    const hasActiveJob = discoveryJobs.some((job) => ["queued", "processing", "running"].includes(job.status));
    if (!hasActiveJob) return undefined;
    const timer = window.setInterval(async () => {
      await Promise.all([loadDiscoveryJobs(), loadDiscoveries()]);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [discoveryJobs]);

  const strongCount = useMemo(
    () => discoveries.filter((item) => item.confidence >= 80 && item.status === "candidate").length,
    [discoveries]
  );

  const visibleDiscoveries = useMemo(() => discoveries.filter((item) => {
    const haystack = `${item.card?.name || ""} ${item.detected_serial || ""} ${item.source_domain || ""} ${item.source_title || ""}`.toLowerCase();
    const matchesSearch = haystack.includes(discoverySearch.trim().toLowerCase());
    const matchesFilter = discoveryFilter === "all" ||
      (discoveryFilter === "active" && ["candidate", "investigating"].includes(item.status)) ||
      item.status === discoveryFilter;
    return matchesSearch && matchesFilter;
  }), [discoveries, discoverySearch, discoveryFilter]);

  async function loadDiscoveries() {
    const { data, error } = await supabase
      .from("pull_discoveries")
      .select("id, source_url, source_domain, source_title, search_summary, detected_serial, confidence, status, found_at, card:cards(id, name, serial_total)")
      .order("found_at", { ascending: false })
      .limit(100);
    if (!error) setDiscoveries(data || []);
  }

  async function loadDiscoveryJobs() {
    const { data, error } = await supabase
      .from("discovery_runs")
      .select("id, status, set_slug, total_cards, cards_searched, results_found, error_message, started_at, completed_at")
      .order("started_at", { ascending: false })
      .limit(8);
    if (!error) setDiscoveryJobs(data || []);
  }

  async function loadSets() {
    const { data, error } = await supabase
      .from("card_sets")
      .select("slug, name")
      .eq("status", "live")
      .order("name");
    if (!error) setSets(data || []);
  }

  async function runDiscoverySearch() {
    setRunningDiscovery(true);
    setDiscoveryProgress("");
    setConceptMessage("Adding the discovery search to the background queue…");
    const { data, error } = await supabase.functions.invoke("discover-pulls", {
      body: { action: "enqueue", set_slug: selectedSet || undefined, max_cards: 3 },
    });
    if (error || data?.error) {
      setConceptMessage(data?.error || error?.message || "The search could not be queued.");
      setRunningDiscovery(false);
      return;
    }
    await loadDiscoveryJobs();
    setDiscoveryProgress(`Queued · 0 of ${data.total_cards} cards checked`);
    setConceptMessage("Search queued. It will keep running if you leave or close this page.");
    setRunningDiscovery(false);
  }

  async function updateDiscovery(id, status) {
    const { error } = await supabase
      .from("pull_discoveries")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setConceptMessage("That discovery could not be updated.");
      return;
    }
    await loadDiscoveries();
    setConceptMessage(status === "rejected" ? "Discovery rejected." : "Discovery saved for investigation.");
  }

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
        <h1>Owner Dashboard</h1>
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
          <h1>Owner Dashboard</h1>
          <p className="ops-intro">
            Review discoveries, prepare content and control automated work from
            one place.
          </p>
        </div>
        <StatusPill tone="low">Pull discovery beta</StatusPill>
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

      {activeTab === "traffic" && (
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
                          <tr key={day.day}><td>{day.day}</td><td>{day.visitors}</td><td>{day.views}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3>Top pages · 7 days</h3>
                  {(traffic.top_pages || []).length ? (
                    <ol className="traffic-pages">
                      {traffic.top_pages.map((page) => <li key={page.path}><span>{page.path}</span><strong>{page.views} views</strong></li>)}
                    </ol>
                  ) : <p>No public page views have been recorded yet.</p>}

                  <h3 className="traffic-subheading">Traffic sources · 7 days</h3>
                  {(traffic.top_referrers || []).length ? (
                    <ol className="traffic-pages">
                      {traffic.top_referrers.map((source) => <li key={source.source}><span>{source.source}</span><strong>{source.visitors} visitors</strong></li>)}
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
                  {(traffic.submissions?.unknown_submissions ?? 0) > 0 && <span><strong>{traffic.submissions.unknown_submissions}</strong> older unclassified</span>}
                </div>
              </div>
            </>
          ) : trafficLoading ? <p>Loading traffic figures…</p> : null}
        </section>
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
                {discoveries.filter((item) => item.status === "candidate").slice(0, 1).map((item) => (
                  <button type="button" onClick={() => setActiveTab("discoveries")} key={item.id}>
                    <StatusPill tone={item.confidence >= 80 ? "low" : "review"}>{item.confidence >= 80 ? "Strong candidate" : "Needs review"}</StatusPill>
                    <span>
                      <strong>{item.card?.name}{item.detected_serial ? ` · ${item.detected_serial}` : ""}</strong>
                      <small>{item.source_domain} · {item.confidence}% confidence</small>
                    </span>
                    <b aria-hidden="true">›</b>
                  </button>
                ))}
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
              <p className="ops-run-time">Every four hours</p>
              <p>
                Six fixed three-card batches cover all 18 Magnificent Monsters
                cards every day and save candidates for private owner review.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("discoveries")}
              >
                Open discovery search
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
            <div className="ops-run-controls">
              <select aria-label="Set to search" value={selectedSet} onChange={(event) => setSelectedSet(event.target.value)}>
                <option value="">All live sets</option>
                {sets.map((set) => <option value={set.slug} key={set.slug}>{set.name}</option>)}
              </select>
              <button type="button" onClick={runDiscoverySearch} disabled={runningDiscovery}>
                {runningDiscovery ? "Queueing…" : selectedSet ? "Search complete set in background" : "Search 3 cards in background"}
              </button>
              {discoveryProgress && <small className="ops-progress-label">{discoveryProgress}</small>}
              {discoveryJobs[0] && (
                <small className="ops-progress-label">
                  Latest: {discoveryJobs[0].status === "completed" ? "Complete" : discoveryJobs[0].status === "failed" ? "Failed" : "Running in background"}
                  {` · ${discoveryJobs[0].cards_searched || 0} of ${discoveryJobs[0].total_cards || 0} cards · ${discoveryJobs[0].results_found || 0} candidates`}
                  {discoveryJobs[0].error_message ? ` · ${discoveryJobs[0].error_message}` : ""}
                </small>
              )}
            </div>
          </div>

          <div className="ops-filter-row">
            <input aria-label="Search discoveries" placeholder="Search card, serial or source" value={discoverySearch} onChange={(event) => setDiscoverySearch(event.target.value)} />
            <select aria-label="Filter discoveries" value={discoveryFilter} onChange={(event) => setDiscoveryFilter(event.target.value)}>
              <option value="active">Needs attention</option>
              <option value="all">All results</option>
              <option value="candidate">Candidates</option>
              <option value="investigating">Investigating</option>
              <option value="rejected">Rejected</option>
            </select>
            <span>{visibleDiscoveries.length} results</span>
          </div>

          <div className="ops-discovery-list">
            {visibleDiscoveries.length === 0 && <div className="ops-empty-results"><strong>No discoveries in this view</strong><span>Run a search or change the filters.</span></div>}
            {visibleDiscoveries.map((item) => {
              const expanded = expandedDiscovery === item.id;
              const tone = item.status === "rejected" ? "high" : item.confidence >= 80 ? "low" : "review";
              const label = item.status === "investigating" ? "Investigating" : item.status === "rejected" ? "Rejected" : item.confidence >= 80 ? "Strong candidate" : "Needs review";
              return (
                <article key={item.id} className={`ops-discovery ops-tone-${tone}`}>
                  <button
                    type="button"
                    className="ops-discovery-summary"
                    aria-expanded={expanded}
                    onClick={() => setExpandedDiscovery(expanded ? null : item.id)}
                  >
                    <span>
                      <strong>{item.card?.name || "Unknown card"}</strong>
                      <small>{item.detected_serial || `Serial not read /${item.card?.serial_total || "?"}`} · {item.source_domain} · {new Date(item.found_at).toLocaleString()}</small>
                    </span>
                    <span>
                      <StatusPill tone={tone}>{label}</StatusPill>
                      <b>{item.confidence}%</b>
                      <i aria-hidden="true">{expanded ? "▲" : "▼"}</i>
                    </span>
                  </button>
                  {expanded && (
                    <div className="ops-discovery-detail">
                      <div className="ops-evidence-placeholder">
                        <span>{item.source_domain}</span>
                        <small>{item.source_title}</small>
                      </div>
                      <div>
                        <h3>Candidate source</h3>
                        <p>{item.search_summary || "The web search cited this page as a possible serialized-card sighting."}</p>
                        <dl>
                          <div><dt>Source</dt><dd>{item.source_domain}</dd></div>
                          <div><dt>Card match</dt><dd>{item.confidence}%</dd></div>
                          <div><dt>Serial detected</dt><dd>{item.detected_serial || "Not readable in search result"}</dd></div>
                        </dl>
                        <div className="ops-actions">
                          <a href={item.source_url} target="_blank" rel="noreferrer" className="ops-source-button">Open source</a>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => updateDiscovery(item.id, "investigating")}
                          >
                            Investigate
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => updateDiscovery(item.id, "rejected")}
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
                  <StatusPill tone={job.status === "Scheduled" ? "low" : job.status === "Ready for connection" ? "review" : "neutral"}>
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
