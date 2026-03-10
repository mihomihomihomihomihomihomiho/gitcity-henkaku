import { NextResponse } from "next/server";
import { getStudents } from "@/lib/students";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const students = await getStudents();
    // 公開情報のみ返す（wallet addressと名前の紐付けは認証済みのみ）
    const publicData = students.map((s) => ({
      id: s.id,
      githubUsername: s.githubUsername,
      projectRepo: s.projectRepo,
    }));
    return NextResponse.json(publicData);
  } catch (err) {
    console.error("Failed to fetch students:", err);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
