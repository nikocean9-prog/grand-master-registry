import CatalogCardArt from "./CatalogCardArt";

export default function SetWordmark({ src, alt, className = "" }) {
  const neutralBackground = src?.includes("Generation_Dragenesis.png");
  return <CatalogCardArt src={src} alt={alt} preserveAspectRatio="xMidYMid meet"
    className={`set-wordmark-art ${neutralBackground ? "set-wordmark-neutral" : ""} ${className}`} />;
}
