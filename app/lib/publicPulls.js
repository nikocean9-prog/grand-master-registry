import { getEvidencePath } from "./evidenceUrl";

export function formatSerialLabel(serial) {
  const total = Number(serial?.card?.serial_total || 100);
  const width = total < 100 ? 2 : 3;
  const number = String(serial?.serial_number ?? "").padStart(width, "0");

  if (serial?.region === "E") return `${number}E`;
  return number;
}
export async function getPublicPulls(supabase, limit = 24) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("submissions")
    .select(`
      id,
      photo_url,
      created_at,
      serial:serials (
        id,
        serial_number,
        region,
        confirmed_at,
        card:cards (
          id,
          name,
          image_url,
          serial_total,
          card_sets (
            name,
            slug,
            tcg_slug
          )
        )
      )
    `)
    .eq("status", "approved")
    .not("photo_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Could not load public pulls:", error);
    return [];
  }

  const unique = [];
  const seenSerials = new Set();

  for (const submission of data || []) {
    if (!submission.serial?.id || !submission.serial?.card) continue;
    if (seenSerials.has(submission.serial.id)) continue;
    seenSerials.add(submission.serial.id);
    unique.push(submission);
  }

  const paths = unique.map((submission) => getEvidencePath(submission.photo_url));
  const validPaths = paths.filter(Boolean);
  let signedByPath = new Map();

  if (validPaths.length) {
    const { data: signedFiles, error: signedError } = await supabase.storage
      .from("submission-evidence")
      .createSignedUrls(validPaths, 3600);

    if (signedError) {
      console.error("Could not sign public pull photos:", signedError);
    } else {
      signedByPath = new Map(
        (signedFiles || []).map((file, index) => [validPaths[index], file.signedUrl])
      );
    }
  }

  return unique.map((submission, index) => {
    const card = submission.serial.card;
    const cardSet = card.card_sets;
    const evidenceUrl = signedByPath.get(paths[index]) || null;

    return {
      id: submission.id,
      serialId: submission.serial.id,
      cardId: card.id,
      cardName: card.name,
      serialLabel: formatSerialLabel(submission.serial),
      region: submission.serial.region,
      setName: cardSet?.name || "Serialised card",
      setSlug: cardSet?.slug || null,
      tcgSlug: cardSet?.tcg_slug || null,
      imageUrl: evidenceUrl || card.image_url || null,
      confirmedAt: submission.serial.confirmed_at || submission.created_at,
    };
  });
}
