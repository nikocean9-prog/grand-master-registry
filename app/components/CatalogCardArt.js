// Crop coordinates describe the card rectangle in a publisher's contact sheet.
// The original bitmap stays unchanged. Never use catalogue crops for evidence.
export default function CatalogCardArt({ src, alt = "", className, loading }) {
  const [url, fragment = ""] = (src || "").split("#");
  const crop = fragment.startsWith("crop=") ? fragment.slice(5).split(",").map(Number) : [];
  if (crop.length !== 6 || crop.some((n) => !Number.isFinite(n)) || crop.slice(2).some((n) => n <= 0)) {
    return <img src={src} alt={alt} className={className} loading={loading} />;
  }
  const [x, y, width, height, sourceWidth, sourceHeight] = crop;
  return (
    <svg className={className} viewBox={`${x} ${y} ${width} ${height}`} role="img" aria-label={alt || undefined} aria-hidden={alt ? undefined : true} preserveAspectRatio="xMidYMid slice">
      {alt && <title>{alt}</title>}
      <image href={url} width={sourceWidth} height={sourceHeight} />
    </svg>
  );
}
