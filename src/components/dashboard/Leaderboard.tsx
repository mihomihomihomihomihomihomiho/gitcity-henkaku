"use client";

import type { CityBuilding } from "@/types";

interface LeaderboardProps {
  buildings: CityBuilding[];
}

export default function Leaderboard({ buildings }: LeaderboardProps) {
  // 高さ（トークン量）順にソート
  const sorted = [...buildings].sort((a, b) => b.height - a.height);

  return (
    <div
      style={{
        background: "#12122a",
        borderRadius: 8,
        padding: 16,
        maxHeight: 400,
        overflowY: "auto",
      }}
    >
      <h2 style={{ margin: "0 0 12px", fontSize: 16, color: "#e0e0e0" }}>
        ランキング
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#888", textAlign: "left" }}>
            <th style={{ padding: "4px 8px" }}>#</th>
            <th style={{ padding: "4px 8px" }}>ユーザー</th>
            <th style={{ padding: "4px 8px", textAlign: "right" }}>トークン</th>
            <th style={{ padding: "4px 8px", textAlign: "right" }}>コミット</th>
            <th style={{ padding: "4px 8px", textAlign: "right" }}>PR</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((b, i) => (
            <tr
              key={b.studentId}
              style={{
                color: "#e0e0e0",
                borderTop: "1px solid #2a2a4a",
              }}
            >
              <td style={{ padding: "6px 8px", opacity: 0.5 }}>{i + 1}</td>
              <td style={{ padding: "6px 8px" }}>{b.label}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>
                {b.height.toFixed(1)}
              </td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>
                {b.width.toFixed(1)}
              </td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>
                {b.depth.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
