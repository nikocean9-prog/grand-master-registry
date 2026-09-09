"use client";

import { useEffect, useRef } from "react";

function pointBetween(a, b, amount) {
  return { x: a.x + (b.x - a.x) * amount, y: a.y + (b.y - a.y) * amount };
}

function quadPoint(corners, u, v) {
  const top = pointBetween(corners[0], corners[1], u);
  const bottom = pointBetween(corners[3], corners[2], u);
  return pointBetween(top, bottom, v);
}

function drawTriangle(context, image, source, destination) {
  const [s0, s1, s2] = source;
  const [d0, d1, d2] = destination;
  const denominator = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(denominator) < 0.00001) return;

  const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / denominator;
  const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / denominator;
  const e = (d0.x * (s1.x * s2.y - s2.x * s1.y) + d1.x * (s2.x * s0.y - s0.x * s2.y) + d2.x * (s0.x * s1.y - s1.x * s0.y)) / denominator;
  const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / denominator;
  const d = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / denominator;
  const f = (d0.y * (s1.x * s2.y - s2.x * s1.y) + d1.y * (s2.x * s0.y - s0.x * s2.y) + d2.y * (s0.x * s1.y - s1.x * s0.y)) / denominator;

  context.save();
  context.beginPath();
  context.moveTo(d0.x, d0.y);
  context.lineTo(d1.x, d1.y);
  context.lineTo(d2.x, d2.y);
  context.closePath();
  context.clip();
  context.setTransform(a, b, c, d, e, f);
  context.drawImage(image, 0, 0);
  context.restore();
}

export function renderCorrectedCard(canvas, image, crop) {
  const context = canvas.getContext("2d");
  if (!context || !crop?.corners?.length) return;
  const width = canvas.width;
  const height = canvas.height;
  const safety = Math.min(0.03, Math.max(0.02, Number(crop.safety) || 0.025));
  const cardRatio = 59 / 86;
  const availableWidth = width * (1 - safety * 2);
  const availableHeight = height * (1 - safety * 2);
  let targetWidth = availableWidth;
  let targetHeight = targetWidth / cardRatio;
  if (targetHeight > availableHeight) {
    targetHeight = availableHeight;
    targetWidth = targetHeight * cardRatio;
  }
  const left = (width - targetWidth) / 2;
  const top = (height - targetHeight) / 2;
  const corners = crop.corners.map((point) => ({ x: point.x * image.naturalWidth, y: point.y * image.naturalHeight }));
  const columns = 18;
  const rows = 26;

  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const u0 = column / columns;
      const u1 = (column + 1) / columns;
      const v0 = row / rows;
      const v1 = (row + 1) / rows;
      const s00 = quadPoint(corners, u0, v0);
      const s10 = quadPoint(corners, u1, v0);
      const s11 = quadPoint(corners, u1, v1);
      const s01 = quadPoint(corners, u0, v1);
      const d00 = { x: left + u0 * targetWidth, y: top + v0 * targetHeight };
      const d10 = { x: left + u1 * targetWidth, y: top + v0 * targetHeight };
      const d11 = { x: left + u1 * targetWidth, y: top + v1 * targetHeight };
      const d01 = { x: left + u0 * targetWidth, y: top + v1 * targetHeight };
      drawTriangle(context, image, [s00, s10, s11], [d00, d10, d11]);
      drawTriangle(context, image, [s00, s11, s01], [d00, d11, d01]);
    }
  }
}

export default function CardPhoto({ src, alt, crop, className = "", loading = "lazy" }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!crop?.corners || !src || !canvasRef.current || !wrapperRef.current) return undefined;
    const image = new Image();
    image.crossOrigin = "anonymous";
    let cancelled = false;

    const render = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(wrapper.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(wrapper.clientHeight * ratio));
      renderCorrectedCard(canvas, image, crop);
    };
    image.onload = render;
    image.src = src;
    const observer = new ResizeObserver(render);
    observer.observe(wrapperRef.current);
    return () => { cancelled = true; observer.disconnect(); };
  }, [src, crop]);

  if (!crop?.corners) return <img className={className} src={src} alt={alt} loading={loading} />;

  return (
    <span ref={wrapperRef} className={`card-photo-corrected ${className}`.trim()} role="img" aria-label={alt}>
      <canvas ref={canvasRef} />
    </span>
  );
}
