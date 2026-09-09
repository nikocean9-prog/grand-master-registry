export function getEvidencePath(photoReference) {
  if (!photoReference) {
    return null;
  }

  const marker = "/storage/v1/object/public/submission-evidence/";
  const markerIndex = photoReference.indexOf(marker);

  if (markerIndex >= 0) {
    return decodeURIComponent(
      photoReference.slice(markerIndex + marker.length)
    );
  }

  return photoReference.replace(/^\/+/, "");
}

export async function getEvidenceUrl(
  supabase,
  photoReference,
  expiresInSeconds = 3600
) {
  const filePath = getEvidencePath(photoReference);

  if (!filePath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from("submission-evidence")
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    console.error("Could not create evidence URL:", error);
    return null;
  }

  return data?.signedUrl || null;
}
