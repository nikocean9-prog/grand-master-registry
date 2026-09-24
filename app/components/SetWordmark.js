import CatalogCardArt from "./CatalogCardArt";

export default function SetWordmark({ src, alt, className = "" }) {
  return <CatalogCardArt src={src} alt={alt} preserveAspectRatio="xMidYMid meet"
    className={`set-wordmark-art ${className}`} />;
}
