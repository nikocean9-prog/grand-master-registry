"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PAGE_SIZE = 25;

export default function SubmissionHistory() {
  const [submissions, setSubmissions] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [cardId, setCardId] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [page, search, cardId, status]);

  async function loadHistory() {
    setLoading(true);
    setMessage("");

    const admin = await getCurrentAdmin(supabase);

    if (!admin) {
      await supabase.auth.signOut();
      window.location.href = "/admin?reason=session";
      return;
    }

    if (cards.length === 0) {
      const { data: cardData } = await supabase
        .from("cards")
        .select("id, name")
        .order("id");
      setCards(cardData || []);
    }

    const { data, error } = await supabase.rpc("search_submission_history", {
      p_search: search,
      p_card_id: cardId ? Number(cardId) : null,
      p_status: status,
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    });

    if (error) {
      setMessage("Could not load submission history.");
      setSubmissions([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setSubmissions(data || []);
    setTotal(data?.[0]?.total_count ? Number(data[0].total_count) : 0);
    setLoading(false);
  }

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(draftSearch.trim());
  }

  function clearSearch() {
    setDraftSearch("");
    setSearch("");
    setCardId("");
    setStatus("all");
    setPage(1);
  }

  function statusColor(value) {
    if (value === "approved") return "#2e7d32";
    if (value === "removed") return "#9a6700";
    return "#b71c1c";
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstResult = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(page * PAGE_SIZE, total);

  return (
    <main>
      <p>
        <a href="/admin/dashboard">← Back to Admin Home</a>
      </p>

      <h1>Submission History</h1>
      <p>Select a submission to view its complete details and evidence.</p>

      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "end",
          margin: "20px 0",
        }}
      >
        <label style={{ minWidth: "220px" }}>
          Card
          <br />
          <select
            value={cardId}
            onChange={(event) => {
              setCardId(event.target.value);
              setPage(1);
            }}
            style={{ width: "100%", padding: "9px" }}
          >
            <option value="">All cards</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ flex: "1 1 280px" }}>
          Serial or submitter email
          <br />
          <input
            type="search"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="For example: 001E or email@example.com"
            style={{ width: "100%", padding: "9px", boxSizing: "border-box" }}
          />
        </label>

        <label>
          Status
          <br />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            style={{ padding: "9px" }}
          >
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="removed">Removed</option>
          </select>
        </label>

        <button type="submit" style={{ padding: "9px 16px" }}>
          Search
        </button>

        {(search || cardId || status !== "all") && (
          <button type="button" onClick={clearSearch} style={{ padding: "9px 16px" }}>
            Clear
          </button>
        )}
      </form>

      {message && <p>{message}</p>}

      {!loading && (
        <p>
          {total === 0
            ? "No matching submissions."
            : `Showing ${firstResult}–${lastResult} of ${total} submissions`}
        </p>
      )}

      {loading ? (
        <p>Loading history...</p>
      ) : submissions.length === 0 ? (
        <p>
          {search || cardId || status !== "all"
            ? "Try changing or clearing the search."
            : "No completed submissions yet."}
        </p>
      ) : (
        submissions.map((submission) => (
          <Link
            key={submission.id}
            href={`/admin/history/${submission.id}`}
            style={{
              display: "block",
              border: "1px solid #ccc",
              borderLeft: `5px solid ${statusColor(submission.status)}`,
              padding: "12px 15px",
              marginBottom: "10px",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "10px 25px",
              }}
            >
              <strong style={{ minWidth: "180px", flex: "1 1 220px" }}>
                {submission.card_name || "Unknown Card"}
              </strong>

              <span style={{ minWidth: "70px" }}>
                {submission.serial_label || "Unknown"}
              </span>

              <span style={{ minWidth: "170px" }}>
                {submission.created_at
                  ? new Date(submission.created_at).toLocaleString()
                  : "Unknown date"}
              </span>

              <strong
                style={{
                  minWidth: "80px",
                  color: statusColor(submission.status),
                  textTransform: "capitalize",
                }}
              >
                {submission.status}
              </strong>
            </div>
          </Link>
        ))
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Submission history pages"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "15px",
            marginTop: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
