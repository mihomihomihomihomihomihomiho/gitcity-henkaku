import { NextResponse } from "next/server";
import { getStudents } from "@/lib/students";
import { getTokenBalances, getTransferHistory } from "@/lib/token-provider";
import { getAllStudentActivities } from "@/lib/github";
import { calculateBuilding } from "@/lib/city-math";
import { calculateLayout } from "@/components/city/CityLayout";
import { buildWaterways } from "@/lib/waterway-builder";
import type { CityData } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5分キャッシュ

export async function GET() {
  try {
    const students = await getStudents();
    const wallets = students.map((s) => s.walletAddress);

    // トークン残高とGitHub活動を並列取得
    const [tokenBalances, githubActivities] = await Promise.all([
      getTokenBalances(wallets),
      getAllStudentActivities(students),
    ]);

    // wallet → TokenBalance マップ
    const balanceMap = new Map(
      tokenBalances.map((b) => [b.walletAddress.toLowerCase(), b])
    );

    // ビル属性を計算
    const rawBuildings = students.map((s) => {
      const tokens = balanceMap.get(s.walletAddress.toLowerCase()) ?? {
        walletAddress: s.walletAddress,
        achievement: 0,
        contribution: 0,
        total: 0,
      };
      const github = githubActivities.get(s.id) ?? {
        commits: 0,
        pullRequests: 0,
        recentActivity: 0,
        lastActive: null,
      };
      return calculateBuilding(s.id, s.githubUsername, tokens, github);
    });

    // スパイラル配置
    const buildings = calculateLayout(rawBuildings);

    // 水路データ
    const transfers = await getTransferHistory();
    const waterways = buildWaterways(transfers, buildings, students);

    const data: CityData = { buildings, waterways };
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to generate city data:", err);
    return NextResponse.json(
      { error: "Failed to generate city data" },
      { status: 500 }
    );
  }
}
