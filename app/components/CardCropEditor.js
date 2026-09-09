"use client";

import { useMemo, useRef, useState } from "react";
import CardPhoto from "./CardPhoto";

const DEFAULT_CORNERS = [
  { x: 0.08, y: 0.08 },
  { x: 0.92, y: 0.08 },
  { x: 0.92, y: 0.92 },
  { x: 0.08, y: 0.92 },
];
const LABELS = ["Top left", "Top right", "Bottom right", "Bottom left"];

export default function CardCropEditor({ src, value, onSave, busy = false }) {
  const stageRef = useRef(null);
  const initial = value?.corners?.length === 4 ? value.corners : DEFAULT_CORNERS;
  const [corners, setCorners] = useState(initial);
  const [dragging, setDragging] = useState(null);
  const crop = useMemo(() => ({ version: 1, safety: 0.025, corners }), [corners]);

  function updateCorner(index, clientX, clientY) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
    setCorners((current) => current.map((corner, cornerIndex) => cornerIndex === index ? point : corner));
  }

  return (
    <section className="card-crop-editor">
      <div className="card-crop-editor-heading">
        <div><h3>Straighten for display</h3><p>Move each numbered point to the printed card corner—not the sleeve or top loader.</p></div>
        <button type="button" onClick={() => setCorners(DEFAULT_CORNERS)}>Reset points</button>
      </div>
      <div className="card-crop-editor-grid">
        <div
          ref={stageRef}
          className="card-crop-stage"
          onPointerMove={(event) => dragging !== null && updateCorner(dragging, event.clientX, event.clientY)}
          onPointerUp={() => setDragging(null)}
          onPointerCancel={() => setDragging(null)}
        >
          <img src={src} alt="Original submission with adjustable card corners" draggable="false" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polygon points={corners.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")} />
          </svg>
          {corners.map((point, index) => (
            <button
              key={LABELS[index]}
              type="button"
              className="card-crop-handle"
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
              aria-label={LABELS[index]}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(index); }}
              onPointerMove={(event) => dragging === index && updateCorner(index, event.clientX, event.clientY)}
              onPointerUp={() => setDragging(null)}
            >{index + 1}</button>
          ))}
        </div>
        <div className="card-crop-preview">
          <span>Public display preview</span>
          <CardPhoto src={src} alt="Straightened card preview" crop={crop} loading="eager" />
          <small>The original evidence photo remains unchanged.</small>
        </div>
      </div>
      <button type="button" className="card-crop-save" disabled={busy} onClick={() => onSave(crop)}>
        {busy ? "Saving display crop…" : "Save straightened display"}
      </button>
    </section>
  );
}
