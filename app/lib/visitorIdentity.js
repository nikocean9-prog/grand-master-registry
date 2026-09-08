const VISITOR_KEY = "tst_submitter_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function validVisitorId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );
}

export function getOrCreateVisitorId() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(VISITOR_KEY);
  if (validVisitorId(stored)) return stored;

  const cookieValue = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_KEY}=`))
    ?.split("=")[1];
  const visitorId = validVisitorId(cookieValue) ? cookieValue : crypto.randomUUID();

  window.localStorage.setItem(VISITOR_KEY, visitorId);
  document.cookie = `${VISITOR_KEY}=${visitorId}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`;
  return visitorId;
}

export async function getAnonymousVisitorHash() {
  const visitorId = getOrCreateVisitorId();
  if (!visitorId) return null;

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(visitorId)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
