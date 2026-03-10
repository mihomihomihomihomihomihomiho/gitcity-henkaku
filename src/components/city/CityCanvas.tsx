"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { CityBuilding, Waterway } from "@/types";
import Isomer, { Point, Shape, Color } from "isomer";

interface CityCanvasProps {
  buildings: CityBuilding[];
  waterways: Waterway[];
  highlightStudentId?: string | null;
  onHoverBuilding?: (building: CityBuilding | null, x: number, y: number) => void;
}

const DEFAULT_SCALE = 18;
const MIN_SCALE = 5;
const MAX_SCALE = 80;
const GROUND_COLOR = new Color(30, 35, 50);
const ROAD_COLOR = new Color(55, 58, 68);
const ROAD_LINE_COLOR = new Color(80, 85, 95);
const TREE_TRUNK_COLOR = new Color(90, 60, 30);
const TREE_LEAF_COLOR = new Color(40, 120, 50);
const TREE_LEAF_LIGHT = new Color(55, 145, 60);
const HIGHLIGHT_COLOR = new Color(255, 215, 0);
const WINDOW_COLOR = new Color(255, 255, 200);

export default function CityCanvas({
  buildings,
  waterways,
  highlightStudentId,
  onHoverBuilding,
}: CityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useRef(DEFAULT_SCALE);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 600 });

  // 窓の位置を事前計算（レンダーごとにランダムにしない）
  const windowPositions = useRef<number[][]>([]);
  useEffect(() => {
    windowPositions.current = buildings.map((b) => {
      const wins: number[] = [];
      const numWindows = Math.ceil(b.litPercentage * 3);
      for (let j = 0; j < numWindows; j++) {
        wins.push(
          0.15 + ((0.2 + j * 0.25) * (b.height - 0.5)) / Math.max(1, numWindows)
        );
      }
      return wins;
    });
  }, [buildings]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const iso = new Isomer(canvas, {
      scale: scaleRef.current,
      originX: canvas.width / 2 + panRef.current.x,
      originY: canvas.height * 0.35 + panRef.current.y,
    });

    const offsetX = 3;
    const offsetY = 5;

    // === 道路グリッド ===
    if (buildings.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const b of buildings) {
        minX = Math.min(minX, b.position.x);
        maxX = Math.max(maxX, b.position.x);
        minY = Math.min(minY, b.position.y);
        maxY = Math.max(maxY, b.position.y);
      }
      const pad = 2.5;
      const roadW = 0.45;
      const spacing = 3.2;
      const half = spacing / 2; // 道路はビル間（半グリッドずらし）
      const lineW = 0.04;
      // 道路グリッドをspacing/2ずらす → ビルとビルの間を通る
      const roadStartX = Math.floor((minX - pad) / spacing) * spacing + half;
      const roadStartY = Math.floor((minY - pad) / spacing) * spacing + half;
      const roadEndX = maxX + pad;
      const roadEndY = maxY + pad;
      const totalLenX = roadEndX - roadStartX + pad;
      const totalLenY = roadEndY - roadStartY + pad;

      // X方向の道路（Y座標がグリッド+half位置）
      for (let gy = roadStartY; gy <= roadEndY; gy += spacing) {
        iso.add(
          Shape.Prism(
            new Point(roadStartX + offsetX - pad / 2, gy + offsetY - roadW / 2, 0),
            totalLenX, roadW, 0.01
          ),
          ROAD_COLOR
        );
        iso.add(
          Shape.Prism(
            new Point(roadStartX + offsetX - pad / 2, gy + offsetY - lineW / 2, 0.011),
            totalLenX, lineW, 0.002
          ),
          ROAD_LINE_COLOR
        );
      }
      // Y方向の道路（X座標がグリッド+half位置）
      for (let gx = roadStartX; gx <= roadEndX; gx += spacing) {
        iso.add(
          Shape.Prism(
            new Point(gx + offsetX - roadW / 2, roadStartY + offsetY - pad / 2, 0),
            roadW, totalLenY, 0.01
          ),
          ROAD_COLOR
        );
        iso.add(
          Shape.Prism(
            new Point(gx + offsetX - lineW / 2, roadStartY + offsetY - pad / 2, 0.011),
            lineW, totalLenY, 0.002
          ),
          ROAD_LINE_COLOR
        );
      }

      // === 街路樹 ===
      // 道路沿い（交差点付近）に配置、ビルと重ならない場所のみ
      const treePositions: { x: number; y: number }[] = [];
      for (let gx = roadStartX; gx <= roadEndX; gx += spacing) {
        for (let gy = roadStartY; gy <= roadEndY; gy += spacing) {
          const treeOff = roadW / 2 + 0.3;
          const spots = [
            { x: gx + treeOff, y: gy + treeOff },
            { x: gx - treeOff, y: gy - treeOff },
          ];
          for (const s of spots) {
            let nearBuilding = false;
            for (const b of buildings) {
              if (Math.abs(b.position.x - s.x) < b.width / 2 + 0.3 &&
                  Math.abs(b.position.y - s.y) < b.depth / 2 + 0.3) {
                nearBuilding = true;
                break;
              }
            }
            if (!nearBuilding) treePositions.push(s);
          }
        }
      }

      for (const tp of treePositions) {
        const tx = tp.x + offsetX;
        const ty = tp.y + offsetY;
        const s = 0.06; // 幹の太さ
        // 幹（短め）
        iso.add(
          Shape.Prism(new Point(tx - s / 2, ty - s / 2, 0.01), s, s, 0.12),
          TREE_TRUNK_COLOR
        );
        // 葉っぱ（丸みを出すために2段、正方形）
        const leafS = 0.22;
        iso.add(
          Shape.Prism(new Point(tx - leafS / 2, ty - leafS / 2, 0.10), leafS, leafS, 0.18),
          TREE_LEAF_COLOR
        );
        const leafS2 = 0.15;
        iso.add(
          Shape.Prism(new Point(tx - leafS2 / 2, ty - leafS2 / 2, 0.24), leafS2, leafS2, 0.12),
          TREE_LEAF_LIGHT
        );
      }
    }

    // 地面プレート
    for (const b of buildings) {
      iso.add(
        Shape.Prism(
          new Point(
            b.position.x + offsetX - b.width / 2,
            b.position.y + offsetY - b.depth / 2,
            0
          ),
          b.width + 0.4,
          b.depth + 0.4,
          0.05
        ),
        GROUND_COLOR
      );
    }

    // 水路（道路に沿ったルーティング — 色で流量を表現）
    const t = 0.08;
    const wh = 0.02;
    // 道路グリッド座標を再計算（水路ルーティング用）
    const spacing = 3.2;
    const halfSp = spacing / 2;
    let rMinX = 0, rMinY = 0;
    if (buildings.length > 0) {
      let bMinX = Infinity, bMinY = Infinity;
      for (const b of buildings) {
        bMinX = Math.min(bMinX, b.position.x);
        bMinY = Math.min(bMinY, b.position.y);
      }
      rMinX = Math.floor((bMinX - 2.5) / spacing) * spacing + halfSp;
      rMinY = Math.floor((bMinY - 2.5) / spacing) * spacing + halfSp;
    }
    // 最寄りの道路グリッド線を返す
    const snapToRoadX = (x: number) => Math.round((x - rMinX) / spacing) * spacing + rMinX;
    const snapToRoadY = (y: number) => Math.round((y - rMinY) / spacing) * spacing + rMinY;
    // レーン幅（道路内で水路を並べる）
    const laneW = 0.07;
    // 線分描画ヘルパー（lane: 道路の中心からのオフセット）
    const drawSeg = (x1: number, y1: number, x2: number, y2: number, lane: number, color: Color) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lo = lane * laneW; // レーンオフセット
      if (Math.abs(dx) > 0.01 && Math.abs(dy) < 0.01) {
        // X方向 → Y方向にオフセット
        iso.add(Shape.Prism(new Point(Math.min(x1, x2) + offsetX, y1 + lo + offsetY - t / 2, 0.012), Math.abs(dx), t, wh), color);
      } else if (Math.abs(dy) > 0.01 && Math.abs(dx) < 0.01) {
        // Y方向 → X方向にオフセット
        iso.add(Shape.Prism(new Point(x1 + lo + offsetX - t / 2, Math.min(y1, y2) + offsetY, 0.012), t, Math.abs(dy), wh), color);
      }
    };
    const drawCorner = (x: number, y: number, laneX: number, laneY: number, color: Color) => {
      iso.add(Shape.Prism(new Point(x + laneX * laneW + offsetX - t / 2, y + laneY * laneW + offsetY - t / 2, 0.012), t, t, wh), color);
    };

    for (let wi = 0; wi < waterways.length; wi++) {
      const ww = waterways[wi];
      const fx = ww.fromPosition.x;
      const fy = ww.fromPosition.y;
      const tx = ww.toPosition.x;
      const ty = ww.toPosition.y;

      // 流量で色を決定
      const maxFlow = 20;
      const ratio = Math.min(1, ww.flowVolume / maxFlow);
      let cr: number, cg: number, cb: number;
      if (ratio < 0.4) {
        cr = Math.floor(20 + ratio * 50);
        cg = Math.floor(20 + ratio * 100);
        cb = Math.floor(20 + ratio * 30);
      } else if (ratio < 0.7) {
        const t2 = (ratio - 0.4) / 0.3;
        cr = Math.floor(40 + t2 * 80);
        cg = Math.floor(160 - t2 * 40);
        cb = Math.floor(32 + t2 * 10);
      } else {
        const t2 = (ratio - 0.7) / 0.3;
        cr = Math.floor(120 + t2 * 135);
        cg = Math.floor(120 - t2 * 90);
        cb = Math.floor(42 - t2 * 20);
      }
      const wColor = new Color(cr, cg, cb);

      // レーン番号: 水路インデックスで振り分け（-2,-1,0,1,2）
      const lane = (wi % 5) - 2;

      const rX1 = snapToRoadX(fx);
      const rY2 = snapToRoadY(ty);

      // seg1: (fx, fy) → (rX1, fy)  X方向 → Yオフセット
      drawSeg(fx, fy, rX1, fy, lane, wColor);
      // 角1: X方向→Y方向の切り替わり
      drawCorner(rX1, fy, lane, lane, wColor);
      // seg2: (rX1, fy) → (rX1, rY2)  Y方向 → Xオフセット
      drawSeg(rX1, fy, rX1, rY2, lane, wColor);
      // 角2: Y方向→X方向の切り替わり
      drawCorner(rX1, rY2, lane, lane, wColor);
      // seg3: (rX1, rY2) → (tx, rY2)  X方向 → Yオフセット
      drawSeg(rX1, rY2, tx, rY2, lane, wColor);
      // 角3: X方向→Y方向の切り替わり
      drawCorner(tx, rY2, lane, lane, wColor);
      // seg4: (tx, rY2) → (tx, ty)  Y方向 → Xオフセット
      drawSeg(tx, rY2, tx, ty, lane, wColor);
    }

    // ビル描画（奥→手前ソート）
    const indices = buildings.map((_, i) => i);
    indices.sort(
      (a, b) =>
        buildings[b].position.x +
        buildings[b].position.y -
        (buildings[a].position.x + buildings[a].position.y)
    );

    for (const idx of indices) {
      const b = buildings[idx];
      const isHighlighted = highlightStudentId === b.studentId;
      const color = isHighlighted
        ? HIGHLIGHT_COLOR
        : new Color(b.color.r, b.color.g, b.color.b);

      iso.add(
        Shape.Prism(
          new Point(
            b.position.x + offsetX - b.width / 2,
            b.position.y + offsetY - b.depth / 2,
            0.05
          ),
          b.width,
          b.depth,
          b.height
        ),
        color
      );

      // 窓の明かり
      if (b.litPercentage > 0.3) {
        const wins = windowPositions.current[idx] ?? [];
        for (let wi2 = 0; wi2 < wins.length; wi2++) {
          iso.add(
            Shape.Prism(
              new Point(
                b.position.x + offsetX - b.width / 2 - 0.01,
                b.position.y + offsetY - b.depth / 4 + wi2 * 0.3,
                wins[wi2]
              ),
              0.02,
              0.15,
              0.15
            ),
            WINDOW_COLOR
          );
        }
      }
    }
  }, [buildings, waterways, highlightStudentId]);

  // リサイズ
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        w: Math.min(1200, window.innerWidth - 20),
        h: window.innerHeight - 240,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 描画
  useEffect(() => {
    draw();
  }, [draw, canvasSize]);

  // マウスホイールズーム
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -2 : 2;
      scaleRef.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current + delta));
      draw();
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [draw]);

  // パン（ドラッグ）
  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      panRef.current.x += e.clientX - dragRef.current.lastX;
      panRef.current.y += e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      draw();
    };
    const handleMouseUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draw]);

  // ホバー検出（簡易: canvas座標からビルを推定）
  const handleMouseMoveCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onHoverBuilding || dragRef.current.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // 簡易ヒットテスト: 各ビルの画面上のおおよその位置と比較
    const scale = scaleRef.current;
    const originX = canvas.width / 2 + panRef.current.x;
    const originY = canvas.height * 0.35 + panRef.current.y;
    const offsetX = 3;
    const offsetY = 5;

    let closest: CityBuilding | null = null;
    let closestDist = 50; // px以内でマッチ

    for (const b of buildings) {
      // アイソメトリック座標→画面座標の近似変換
      const isoX = b.position.x + offsetX;
      const isoY = b.position.y + offsetY;
      const screenX = originX + (isoX - isoY) * scale * 0.5;
      const screenY = originY + (isoX + isoY) * scale * 0.25 - b.height * scale * 0.5;
      const dist = Math.hypot(mx - screenX, my - screenY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = b;
      }
    }

    onHoverBuilding(closest, e.clientX, e.clientY);
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.w}
      height={canvasSize.h}
      style={{ borderRadius: 8, cursor: dragRef.current.active ? "grabbing" : "grab" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveCanvas}
    />
  );
}
