// The older seed conflated the English Ace prize (/1000) with the Japanese
// Flagship prize (/2500). Cap public English counts while the seeded rows are reconciled.
export function getVerifiedSerialLimit(setSlug, storedLimit) {
  if (setSlug === "one-piece-championship-2025-ace") return 1000;
  return Number(storedLimit || 0);
}
