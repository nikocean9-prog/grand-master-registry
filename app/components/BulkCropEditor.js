"use client";

import { useId, useRef, useState } from "react";

const DEFAULT_FRAME = { cx: 0.5, cy: 0.5, width: 1, height: 1, rotation: 0 };
const MIN_SIZE = 0.12;
const MAX_SIZE = 1;
const SNAP_ANGLES = [-180, -90, 0, 90, 180];
const SNAP_THRESHOLD = 4;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normaliseAngle(value) {
  let angle = value;
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

function snapAngle(value) {
  const angle = normaliseAngle(value);
  const closest = SNAP_ANGLES.reduce((best, candidate) => (
    Math.abs(candidate - angle) < Math.abs(best - angle) ? candidate : best
  ), SNAP_ANGLES[0]);
  return Math.abs(closest - angle) <= SNAP_THRESHOLD ? closest : angle;
}

function sanitiseFrame(frame) {
  if (!frame || typeof frame !== "object") return { ...DEFAULT_FRAME };
  const next = {
    cx: Number(frame.cx),
    cy: Number(frame.cy),
    width: Number(frame.width),
    height: Number(frame.height),
    rotation: Number(frame.rotation),
  };
  if (!Object.values(next).every(Number.isFinite)) return { ...DEFAULT_FRAME };
  next.width = clamp(next.width, MIN_SIZE, MAX_SIZE);
  next.height = clamp(next.height, MIN_SIZE, MAX_SIZE);
  next.rotation = normaliseAngle(next.rotation);
  return fitFrame(next);
}

function frameCorners(frame) {
  const radians = frame.rotation * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return [
    [-frame.width / 2, -frame.height / 2],
    [frame.width / 2, -frame.height / 2],
    [frame.width / 2, frame.height / 2],
    [-frame.width / 2, frame.height / 2],
  ].map(([x, y]) => ({
    x: frame.cx + x * cosine - y * sine,
    y: frame.cy + x * sine + y * cosine,
  }));
}

function fitFrame(frame) {
  const radians = frame.rotation * Math.PI / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  let width = clamp(frame.width, MIN_SIZE, MAX_SIZE);
  let height = clamp(frame.height, MIN_SIZE, MAX_SIZE);
  const initialExtentX = cosine * width / 2 + sine * height / 2;
  const initialExtentY = sine * width / 2 + cosine * height / 2;
  const scale = Math.min(1, 0.5 / Math.max(initialExtentX, 0.001), 0.5 / Math.max(initialExtentY, 0.001));
  width = Math.max(MIN_SIZE, width * scale);
  height = Math.max(MIN_SIZE, height * scale);
  const extentX = cosine * width / 2 + sine * height / 2;
  const extentY = sine * width / 2 + cosine * height / 2;
  return {
    cx: clamp(frame.cx, extentX, 1 - extentX),
    cy: clamp(frame.cy, extentY, 1 - extentY),
    width,
    height,
    rotation: normaliseAngle(frame.rotation),
  };
}

function frameFromCrop(crop) {
  if (crop?.frame) return sanitiseFrame(crop.frame);
  if (!Array.isArray(crop?.corners) || crop.corners.length !== 4) return { ...DEFAULT_FRAME };
  const [topLeft, topRight, bottomRight, bottomLeft] = crop.corners;
  const points = [topLeft, topRight, bottomRight, bottomLeft];
  if (!points.every((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))) {
    return { ...DEFAULT_FRAME };
  }
  return sanitiseFrame({
    cx: points.reduce((sum, point) => sum + Number(point.x), 0) / 4,
    cy: points.reduce((sum, point) => sum + Number(point.y), 0) / 4,
    width: Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y),
    height: Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y),
    rotation: Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x) * 180 / Math.PI,
  });
}

function cropFromFrame(frame) {
  const cleaned = sanitiseFrame(frame);
  return {
    version: 1,
    safety: 0.025,
    corners: frameCorners(cleaned).map((point) => ({
      x: Number(point.x.toFixed(6)),
      y: Number(point.y.toFixed(6)),
    })),
    frame: Object.fromEntries(Object.entries(cleaned).map(([key, value]) => [key, Number(value.toFixed(6))])),
  };
}

function rotatePoint(point, degrees) {
  const radians = degrees * Math.PI / 180;
  return {
    x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
    y: point.x * Math.sin(radians) + point.y * Math.cos(radians),
  };
}

export default function BulkCropEditor({ src, alt, value, onCommit, saving = false, error = "" }) {
  const [frame, setFrame] = useState(() => frameFromCrop(value));
  const frameRef = useRef(frame);
  const stageRef = useRef(null);
  const gestureRef = useRef(null);
  const maskId = useId().replace(/:/g, "");
  const corners = frameCorners(frame);
  const radians = frame.rotation * Math.PI / 180;
  const rotateHandle = {
    x: frame.cx + Math.sin(radians) * frame.height * 0.38,
    y: frame.cy - Math.cos(radians) * frame.height * 0.38,
  };
  const topMiddle = {
    x: (corners[0].x + corners[1].x) / 2,
    y: (corners[0].y + corners[1].y) / 2,
  };

  function pointerPosition(event) {
    const bounds = stageRef.current.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    };
  }

  function updateFrame(nextFrame) {
    frameRef.current = nextFrame;
    setFrame(nextFrame);
  }

  function startGesture(event) {
    const target = event.target.closest?.("[data-crop-action]");
    if (!target || !stageRef.current) return;
    event.preventDefault();
    const point = pointerPosition(event);
    gestureRef.current = {
      action: target.dataset.cropAction,
      corner: Number(target.dataset.corner),
      frame: frameRef.current,
      point,
    };
    stageRef.current.setPointerCapture(event.pointerId);
  }

  function moveGesture(event) {
    const gesture = gestureRef.current;
    if (!gesture) return;
    event.preventDefault();
    const point = pointerPosition(event);
    if (gesture.action === "move") {
      updateFrame(fitFrame({
        ...gesture.frame,
        cx: gesture.frame.cx + point.x - gesture.point.x,
        cy: gesture.frame.cy + point.y - gesture.point.y,
      }));
      return;
    }
    if (gesture.action === "resize") {
      const opposite = frameCorners(gesture.frame)[(gesture.corner + 2) % 4];
      const localPointNow = rotatePoint(point, -gesture.frame.rotation);
      const localOpposite = rotatePoint(opposite, -gesture.frame.rotation);
      const localCentre = {
        x: (localPointNow.x + localOpposite.x) / 2,
        y: (localPointNow.y + localOpposite.y) / 2,
      };
      const centre = rotatePoint(localCentre, gesture.frame.rotation);
      updateFrame(fitFrame({
        ...gesture.frame,
        cx: centre.x,
        cy: centre.y,
        width: Math.max(MIN_SIZE, Math.abs(localPointNow.x - localOpposite.x)),
        height: Math.max(MIN_SIZE, Math.abs(localPointNow.y - localOpposite.y)),
      }));
      return;
    }
    if (gesture.action === "rotate") {
      const angle = Math.atan2(point.y - gesture.frame.cy, point.x - gesture.frame.cx) * 180 / Math.PI + 90;
      updateFrame(fitFrame({ ...gesture.frame, rotation: snapAngle(angle) }));
    }
  }

  function finishGesture(event) {
    if (!gestureRef.current) return;
    event.preventDefault();
    gestureRef.current = null;
    if (stageRef.current?.hasPointerCapture(event.pointerId)) stageRef.current.releasePointerCapture(event.pointerId);
    onCommit(cropFromFrame(frameRef.current));
  }

  function resetFrame() {
    const next = { ...DEFAULT_FRAME };
    updateFrame(next);
    onCommit(cropFromFrame(next));
  }

  return (
    <div className="bulk-crop-editor">
      <div className="bulk-crop-instructions">
        <p><strong>Crop and straighten</strong><span>Drag the frame · resize from a corner · rotate with the gold pivot</span></p>
        <button type="button" className="secondary-button" onClick={resetFrame} disabled={saving}>Reset</button>
      </div>
      <div
        ref={stageRef}
        className="bulk-crop-stage"
        onPointerDown={startGesture}
        onPointerMove={moveGesture}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
      >
        <img src={src} alt={alt} draggable="false" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <mask id={maskId}>
              <rect width="100" height="100" fill="white" />
              <polygon points={corners.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")} fill="black" />
            </mask>
          </defs>
          <rect width="100" height="100" mask={`url(#${maskId})`} className="bulk-crop-shade" />
          <polygon className="bulk-crop-outline" points={corners.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")} />
          <line x1={topMiddle.x * 100} y1={topMiddle.y * 100} x2={rotateHandle.x * 100} y2={rotateHandle.y * 100} className="bulk-crop-rotate-line" />
        </svg>
        <button
          type="button"
          className="bulk-crop-move"
          data-crop-action="move"
          aria-label="Move crop frame"
          style={{
            left: `${frame.cx * 100}%`, top: `${frame.cy * 100}%`,
            width: `${frame.width * 100}%`, height: `${frame.height * 100}%`,
            transform: `translate(-50%, -50%) rotate(${frame.rotation}deg)`,
          }}
        />
        {corners.map((point, index) => (
          <button
            type="button"
            className="bulk-crop-handle"
            data-crop-action="resize"
            data-corner={index}
            aria-label={`Resize crop from corner ${index + 1}`}
            key={index}
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
          />
        ))}
        <button
          type="button"
          className="bulk-crop-rotate"
          data-crop-action="rotate"
          aria-label="Rotate crop frame"
          title="Drag to rotate"
          style={{ left: `${rotateHandle.x * 100}%`, top: `${rotateHandle.y * 100}%` }}
        >↻</button>
      </div>
      <p className={`bulk-crop-status${error ? " bulk-crop-status-error" : ""}`} role="status">
        {error || (saving ? "Saving crop…" : "Changes save automatically")}
      </p>
    </div>
  );
}
