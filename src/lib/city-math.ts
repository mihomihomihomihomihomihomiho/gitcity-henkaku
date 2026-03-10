import type { CityBuilding, TokenBalance, GitHubActivity } from "@/types";

// ---- 定数（チューニング用） ----

const BASE_HEIGHT = 0.5;
const HEIGHT_SCALE = 1 / 20; // tokens / 20
const MAX_HEIGHT = 5;

const BASE_WIDTH = 1.0;
const WIDTH_SCALE = 1 / 40; // commits / 40
const MAX_WIDTH = 2.5;

const BASE_DEPTH = 0.8;
const DEPTH_SCALE = 1 / 10; // PRs / 10
const MAX_DEPTH = 2.0;

/**
 * 受講生データからビル属性を計算する。
 */
export function calculateBuilding(
  studentId: string,
  label: string,
  tokens: TokenBalance,
  github: GitHubActivity
): Omit<CityBuilding, "position"> {
  const height = Math.min(MAX_HEIGHT, BASE_HEIGHT + tokens.total * HEIGHT_SCALE);
  const width = Math.min(MAX_WIDTH, BASE_WIDTH + github.commits * WIDTH_SCALE);
  const depth = Math.min(MAX_DEPTH, BASE_DEPTH + github.pullRequests * DEPTH_SCALE);
  const color = tokenToColor(tokens.total, github.recentActivity);
  const litPercentage = github.recentActivity;

  return {
    studentId,
    label,
    height,
    width,
    depth,
    color,
    litPercentage,
  };
}

/**
 * トークン量と活動度からビルの色を計算。
 * 多い = 鮮やか（緑系）、少ない = 淡い。活動度が高いと明るい。
 */
function tokenToColor(
  tokens: number,
  activity: number
): { r: number; g: number; b: number } {
  const ratio = Math.min(1, tokens / 90);
  const r = Math.floor(40 + (1 - ratio) * 80);
  const g = Math.floor(120 + ratio * 85);
  const b = Math.floor(140 + ratio * 60);
  const brightness = 1 + activity * 0.3;
  return {
    r: Math.min(255, Math.floor(r * brightness)),
    g: Math.min(255, Math.floor(g * brightness)),
    b: Math.min(255, Math.floor(b * brightness)),
  };
}
