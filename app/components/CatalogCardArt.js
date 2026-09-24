import CardPhoto from "./CardPhoto";

// Crop coordinates describe the card rectangle in a publisher's contact sheet.
// The original bitmap stays unchanged. Never use catalogue crops for evidence.
export default function CatalogCardArt({ src, alt = "", className, loading, preserveAspectRatio = "xMidYMid slice" }) {
  const [url, fragment = ""] = (src || "").split("#");
  const patch = fragment.startsWith("patch=") ? fragment.slice(6).split(",") : [];
  if (patch.length === 7) {
    const [replacement, ...values] = patch;
    const [x, y, width, height, sourceWidth, sourceHeight] = values.map(Number);
    if (values.every((n) => Number.isFinite(Number(n))) && sourceWidth > 0 && sourceHeight > 0) {
      const clipId = `catalogue-patch-${url.replace(/[^a-z0-9]/gi, "-")}`;
      return <svg className={className} viewBox={`0 0 ${sourceWidth} ${sourceHeight}`} role="img" aria-label={alt} preserveAspectRatio={preserveAspectRatio}>
        <title>{alt}</title>
        <defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height} /></clipPath></defs>
        <image href={url} width={sourceWidth} height={sourceHeight} />
        <image href={replacement} width={sourceWidth} height={sourceHeight} preserveAspectRatio="none" clipPath={`url(#${clipId})`} />
      </svg>;
    }
  }
  const quad = fragment.startsWith("quad=") ? fragment.slice(5).split(",").map(Number) : [];
  if (quad.length === 10 && quad.every(Number.isFinite) && quad[8] > 0 && quad[9] > 0) {
    const corners = [0, 2, 4, 6].map((i) => ({ x: quad[i] / quad[8], y: quad[i + 1] / quad[9] }));
    return <CardPhoto src={url} alt={alt} className={className} loading={loading} crop={{ corners }} catalogue />;
  }
  const crop = fragment.startsWith("crop=") ? fragment.slice(5).split(",").map(Number) : [];
  if (crop.length !== 6 || crop.some((n) => !Number.isFinite(n)) || crop.slice(2).some((n) => n <= 0)) {
    return <img src={src} alt={alt} className={className} loading={loading} />;
  }
  const [x, y, width, height, sourceWidth, sourceHeight] = crop;
  return (
    <svg className={className} viewBox={`${x} ${y} ${width} ${height}`} role="img" aria-label={alt || undefined} aria-hidden={alt ? undefined : true} preserveAspectRatio={preserveAspectRatio}>
      {alt && <title>{alt}</title>}
      <image href={url} width={sourceWidth} height={sourceHeight} />
    </svg>
  );
}
