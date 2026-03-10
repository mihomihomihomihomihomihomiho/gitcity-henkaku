// ---- 受講生データ ----

export interface StudentData {
  id: string;
  name: string;
  githubUsername: string;
  walletAddress: string;
  projectRepo: string;
}

// ---- トークン ----

export interface TokenBalance {
  walletAddress: string;
  achievement: number; // 成績トークン
  contribution: number; // 貢献トークン
  total: number;
}

export interface TokenTransfer {
  from: string; // wallet address
  to: string;
  amount: number;
  tokenType: "achievement" | "contribution";
  timestamp: string; // ISO 8601
  txHash: string;
}

// ---- GitHub ----

export interface GitHubActivity {
  commits: number;
  pullRequests: number;
  recentActivity: number; // 0-1 (直近7日の活動度)
  lastActive: string | null; // ISO 8601
}

// ---- City描画 ----

export interface CityBuilding {
  studentId: string;
  label: string; // GitHubユーザー名
  position: { x: number; y: number };
  height: number; // トークン総数から計算
  width: number; // commit数から計算
  depth: number; // PR数から計算
  color: { r: number; g: number; b: number };
  litPercentage: number; // 窓の明かり (0-1)
}

// ---- 水路 ----

export interface Waterway {
  fromStudentId: string;
  toStudentId: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  flowVolume: number; // 累計流通量 → 太さ
  recentFlow: number; // 直近7日 → アニメーション速度
  bidirectional: boolean;
}

// ---- Provider ----

export interface TokenProvider {
  getTokenBalances(wallets: string[]): Promise<TokenBalance[]>;
  getTransferHistory(): Promise<TokenTransfer[]>;
}

// ---- API Response ----

export interface CityData {
  buildings: CityBuilding[];
  waterways: Waterway[];
}
