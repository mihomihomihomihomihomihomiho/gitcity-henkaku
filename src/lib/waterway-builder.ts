import type {
  TokenTransfer,
  CityBuilding,
  StudentData,
  Waterway,
} from "@/types";

const MIN_FLOW_VOLUME = 2; // これ以下の水路は非表示（ノイズ除去）
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Transfer履歴からWaterway[]を生成する。
 *
 * 1. Transfer履歴をfrom-toペアで集約
 * 2. 各ペアの累計量・直近7日量を計算
 * 3. ビルの位置座標を紐付け
 * 4. 最小流通量以下を除外
 * 5. 双方向判定
 */
export function buildWaterways(
  transfers: TokenTransfer[],
  buildings: CityBuilding[],
  students: StudentData[]
): Waterway[] {
  // wallet → studentId マップ
  const walletToId = new Map<string, string>();
  for (const s of students) {
    walletToId.set(s.walletAddress.toLowerCase(), s.id);
  }

  // studentId → position マップ
  const idToPosition = new Map<string, { x: number; y: number }>();
  for (const b of buildings) {
    idToPosition.set(b.studentId, b.position);
  }

  // from-toペアで集約
  const pairMap = new Map<
    string,
    { fromId: string; toId: string; totalVolume: number; recentVolume: number }
  >();

  const now = Date.now();

  for (const t of transfers) {
    if (t.tokenType !== "contribution") continue;

    const fromId = walletToId.get(t.from.toLowerCase());
    const toId = walletToId.get(t.to.toLowerCase());
    if (!fromId || !toId || fromId === toId) continue;

    const key = `${fromId}->${toId}`;
    const existing = pairMap.get(key);
    const isRecent =
      now - new Date(t.timestamp).getTime() < SEVEN_DAYS_MS;

    if (existing) {
      existing.totalVolume += t.amount;
      if (isRecent) existing.recentVolume += t.amount;
    } else {
      pairMap.set(key, {
        fromId,
        toId,
        totalVolume: t.amount,
        recentVolume: isRecent ? t.amount : 0,
      });
    }
  }

  // 双方向判定用セット
  const pairKeys = new Set(pairMap.keys());
  // 双方向ペアの重複除去用（A→BとB→Aの両方がある場合、1本だけ描画）
  const processed = new Set<string>();

  // Waterway[] 生成
  const waterways: Waterway[] = [];

  for (const [key, pair] of pairMap) {
    if (pair.totalVolume < MIN_FLOW_VOLUME) continue;

    const reverseKey = `${pair.toId}->${pair.fromId}`;
    const bidirectional = pairKeys.has(reverseKey);

    // 双方向の場合、逆方向が既に処理済みならスキップ
    if (bidirectional && processed.has(reverseKey)) continue;
    processed.add(key);

    const fromPos = idToPosition.get(pair.fromId);
    const toPos = idToPosition.get(pair.toId);
    if (!fromPos || !toPos) continue;

    // 双方向なら両方の流量を合算
    const reversePair = bidirectional ? pairMap.get(reverseKey) : null;
    const totalFlow = pair.totalVolume + (reversePair?.totalVolume ?? 0);
    const totalRecent = pair.recentVolume + (reversePair?.recentVolume ?? 0);

    waterways.push({
      fromStudentId: pair.fromId,
      toStudentId: pair.toId,
      fromPosition: fromPos,
      toPosition: toPos,
      flowVolume: totalFlow,
      recentFlow: totalRecent,
      bidirectional,
    });
  }

  return waterways;
}
