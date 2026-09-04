import { ImageResponse } from "next/og";

export const alt =
  "TCG Serial Tracker — Tracking every serial. Preserving every pull.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 84px",
          color: "white",
          background:
            "radial-gradient(circle at 88% 10%, rgba(74, 222, 128, 0.34), transparent 38%), linear-gradient(135deg, #0b1220, #1f2937)",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            width: 128,
            height: 128,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "5px solid #60d98b",
            borderRadius: 28,
            background: "#111827",
            color: "#f5c451",
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          TST
        </div>
        <div
          style={{
            marginTop: 50,
            color: "#8de0aa",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
          }}
        >
          The global serial card registry
        </div>
        <div style={{ marginTop: 18, fontSize: 68, fontWeight: 800 }}>
          TCG Serial Tracker
        </div>
        <div style={{ marginTop: 18, color: "#d1d5db", fontSize: 34 }}>
          Tracking every serial. Preserving every pull.
        </div>
        <div style={{ marginTop: 40, color: "#f5c451", fontSize: 22 }}>
          tcgserialtracker.com
        </div>
      </div>
    ),
    size
  );
}
