// Original, scalable title treatment for releases with no usable publisher wordmark.
// It deliberately uses the release name rather than passing itself off as an official logo.
const PALETTES = {
  universus: ["#1c3038", "#d96a3e"],
  "one-piece": ["#8e281d", "#d99838"],
  "dragon-ball-super": ["#ad3920", "#e1a329"],
  "neopets-battledome": ["#153b67", "#43a8b8"],
  altered: ["#304259", "#c3a564"],
  "cardfight-vanguard": ["#273d60", "#d63845"],
  riftbound: ["#184257", "#dc9b35"],
  digimon: ["#28356b", "#a3a4d7"],
};

function wrapTitle(title) {
  const words = title.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > 17) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

export default function SetTitleArtwork({ name, tcg }) {
  const [ink, accent] = PALETTES[tcg] || ["#203d2d", "#bb9955"];
  const [fullTitle, secondary] = name.split("·").map((part) => part.trim());
  const title = fullTitle.includes(":") ? fullTitle.split(":").at(-1).trim() : fullTitle;
  const subtitle = fullTitle.includes(":") ? fullTitle.split(":")[0].trim() : secondary;
  const lines = wrapTitle(title);
  const fontSize = lines.length > 2 ? 58 : lines.length > 1 ? 94 : lines[0].length > 15 ? 108 : 132;
  const lineHeight = lines.length > 2 ? 58 : lines.length > 1 ? 86 : 110;
  const start = 119 - (lines.length - 1) * lineHeight / 2;
  return (
    <svg className="set-wordmark-art set-title-artwork" viewBox="0 0 800 250" role="img" aria-label={`${name} set title`} preserveAspectRatio="xMidYMid meet">
      <title>{name}</title>
      <path d="M160 36h480M160 218h480" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <path d="M387 36l13-9 13 9M387 218l13 9 13-9" fill="none" stroke={accent} strokeWidth="3" />
      {lines.map((text, i) => <text key={`${text}-${i}`} x="400" y={start + i * lineHeight} fill={ink} textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, serif" fontSize={fontSize} fontWeight="bold" textLength={text.length > 10 ? 680 : undefined} lengthAdjust="spacingAndGlyphs">{text}</text>)}
      {subtitle && <text x="400" y={lines.length === 1 ? 206 : 246} fill={accent} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={lines.length === 1 ? 21 : 18} fontWeight="700" letterSpacing="3">{subtitle.toUpperCase().slice(0, 55)}</text>}
    </svg>
  );
}
