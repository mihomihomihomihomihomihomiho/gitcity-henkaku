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

    // 水路（L字型ルーティング）
    for (let wi = 0; wi < waterways.length; wi++) {
      const ww = waterways[wi];
      const fx = ww.fromPosition.x + offsetX;
      const fy = ww.fromPosition.y + offsetY;
      const tx = ww.toPosition.x + offsetX;
      const ty = ww.toPosition.y + offsetY;
      const thickness = 0.15 + Math.min(0.35, ww.flowVolume / 25);
      const intensity = Math.min(1, ww.flowVolume / 15);
      const wColor = new Color(
        Math.floor(40 + intensity * 30),
        Math.floor(140 + intensity * 60),
        Math.floor(180 + intensity * 40)
      );
      const h = 0.03;

      const dxSeg = tx - fx;
      const dySeg = ty - fy;

      if (wi % 2 === 0) {
        // X方向 → Y方向
        if (Math.abs(dxSeg) > 0.01) {
          const xStart = Math.min(fx, tx);
          const xLen = Math.abs(dxSeg);
          iso.add(
            Shape.Prism(new Point(xStart, fy - thickness / 2, 0), xLen, thickness, h),
            wColor
          );
        }
        if (Math.abs(dySeg) > 0.01) {
          const yStart = Math.min(fy, ty);
          const yLen = Math.abs(dySeg);
          iso.add(
            Shape.Prism(new Point(tx - thickness / 2, yStart, 0), thickness, yLen, h),
            wColor
          );
        }
        iso.add(
          Shape.Prism(
            new Point(tx - thickness / 2, fy - thickness / 2, 0),
            thickness,
            thickness,
            h
          ),
          wColor
        );
      } else {
        // Y方向 → X方向
        if (Math.abs(dySeg) > 0.01) {
          const yStart = Math.min(fy, ty);
          const yLen = Math.abs(dySeg);
          iso.add(
            Shape.Prism(new Point(fx - thickness / 2, yStart, 0), thickness, yLen, h),
            wColor
          );
        }
        if (Math.abs(dxSeg) > 0.01) {
          const xStart = Math.min(fx, tx);
          const xLen = Math.abs(dxSeg);
          iso.add(
            Shape.Prism(new Point(xStart, ty - thickness / 2, 0), xLen, thickness, h),
            wColor
          );
        }
        iso.add(
          Shape.Prism(
            new Point(fx - thickness / 2, ty - thickness / 2, 0),
            thickness,
            thickness,
            h
          ),
          wColor
        );
      }
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
