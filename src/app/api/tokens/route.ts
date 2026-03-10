import { NextResponse } from "next/server";
import { getStudents } from "@/lib/students";
import { getTokenBalances } from "@/lib/token-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const students = await getStudents();
    const wallets = students.map((s) => s.walletAddress);
    const balances = await getTokenBalances(wallets);
    return NextResponse.json(balances);
  } catch (err) {
    console.error("Failed to fetch token balances:", err);
    return NextResponse.json(
      { error: "Failed to fetch token balances" },
      { status: 500 }
    );
  }
}
