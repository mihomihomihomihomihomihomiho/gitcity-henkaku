import type { CityBuilding } from "@/types";

const SPACING = 3.2;

/**
 * ビルをトークン順でソートし、中心から外側にスパイラル配置する。
 * 純粋関数: 入力のビルにpositionを付与して返す。
 */
export function calculateLayout(
  buildings: Omit<CityBuilding, "position">[]
): CityBuilding[] {
  // トークン総数が多い順にソート（高さが高いほど中心）
  const sorted = [...buildings].sort((a, b) => b.height - a.height);
  const positions = spiralPositions(sorted.length);

  return sorted.map((building, i) => ({
    ...building,
    position: positions[i],
  }));
}

/**
 * スパイラル配置の座標を計算。
 * 中心(0,0)から外側に渦巻き状に広がる。
 */
function spiralPositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  let dx = 0;
  let dy = -1;
  let stepsTaken = 0;
  let stepsInDirection = 1;
  let dirChanges = 0;

  for (let i = 0; i < count; i++) {
    positions.push({ x: x * SPACING, y: y * SPACING });
    stepsTaken++;
    if (stepsTaken === stepsInDirection) {
      stepsTaken = 0;
      const temp = dx;
      dx = -dy;
      dy = temp;
      dirChanges++;
      if (dirChanges % 2 === 0) stepsInDirection++;
    }
    x += dx;
    y += dy;
  }

  return positions;
}
