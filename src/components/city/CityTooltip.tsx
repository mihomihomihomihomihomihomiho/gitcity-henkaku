"use client";

import type { CityBuilding } from "@/types";

interface CityTooltipProps {
  building: CityBuilding | null;
  x: number;
  y: number;
}

export default function CityTooltip({ building, x, y }: CityTooltipProps) {
  if (!building) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: x + 12,
        top: y - 10,
        background: "rgba(20, 20, 40, 0.95)",
        border: "1px solid #444",
        borderRadius: 6,
        padding: "8px 12px",
        color: "#e0e0e0",
        fontSize: 13,
        pointerEvents: "none",
        zIndex: 100,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>{building.label}</div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>
        <div>高さ（トークン）: {building.height.toFixed(1)}</div>
        <div>幅（コミット）: {building.width.toFixed(1)}</div>
        <div>奥行き（PR）: {building.depth.toFixed(1)}</div>
        <div>活動度: {Math.round(building.litPercentage * 100)}%</div>
      </div>
    </div>
  );
}
