import { NextResponse } from "next/server";
import { getTransferHistory } from "@/lib/token-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const transfers = await getTransferHistory();
    return NextResponse.json(transfers);
  } catch (err) {
    console.error("Failed to fetch transfer history:", err);
    return NextResponse.json(
      { error: "Failed to fetch transfer history" },
      { status: 500 }
    );
  }
}
