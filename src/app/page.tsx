"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import CityCanvas from "@/components/city/CityCanvas";
import CityTooltip from "@/components/city/CityTooltip";
import Leaderboard from "@/components/dashboard/Leaderboard";
import Header from "@/components/shared/Header";
import type { CityBuilding, CityData, StudentData } from "@/types";

export default function Home() {
  const [cityData, setCityData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<CityBuilding | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [myStudentId, setMyStudentId] = useState<string | null>(null);
  const { address } = useAccount();

  // ログインユーザーのビルをハイライト
  useEffect(() => {
    if (!address) {
      setMyStudentId(null);
      return;
    }
    fetch("/api/students")
      .then((res) => res.json())
      .then(() => {
        // wallet→studentIdの紐付けは認証済みAPI経由で行う
        // 暫定: cityDataからaddressベースで検索
        // TODO: 認証済みAPIが返すstudentIdを使用
      })
      .catch(() => {});
  }, [address]);

  useEffect(() => {
    fetch("/api/city")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data: CityData) => {
        setCityData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("データの読み込みに失敗しました");
        setLoading(false);
      });
  }, []);

  const handleHover = useCallback(
    (building: CityBuilding | null, x: number, y: number) => {
      setHoveredBuilding(building);
      setTooltipPos({ x, y });
    },
    []
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1a2e",
        color: "#e0e0e0",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Header />

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 16px 0",
        }}
      >
        {loading && (
          <p style={{ marginTop: 80, opacity: 0.6 }}>街を構築中...</p>
        )}

        {error && (
          <p style={{ marginTop: 80, color: "#ff6b6b" }}>{error}</p>
        )}

        {cityData && (
          <>
            <div style={{ position: "relative" }}>
              <CityCanvas
                buildings={cityData.buildings}
                waterways={cityData.waterways}
                highlightStudentId={myStudentId}
                onHoverBuilding={handleHover}
              />
              <CityTooltip
                building={hoveredBuilding}
                x={tooltipPos.x}
                y={tooltipPos.y}
              />
            </div>

            <div className="legend" style={{
              display: "flex",
              gap: 18,
              marginTop: 8,
              fontSize: 12,
              opacity: 0.7,
            }}>
              <span>&#9632; 高さ = トークン量</span>
              <span style={{ color: "#ff6b6b" }}>&#9632; 幅 = commit数</span>
              <span style={{ color: "#45b7d1" }}>&#9632; 水路 = 貢献トークン流通</span>
            </div>
            <p style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>
              マウスホイールでズーム / ドラッグで移動
            </p>

            <div style={{ width: "100%", maxWidth: 800, marginTop: 24 }}>
              <Leaderboard buildings={cityData.buildings} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
