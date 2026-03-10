import type { StudentData } from "@/types";
import sampleData from "../../data/students.sample.json";

/**
 * 受講生データを取得する。
 * - 開発時: data/students.sample.json
 * - 本番: STUDENTS_DATA 環境変数 (JSON文字列)
 */
export async function getStudents(): Promise<StudentData[]> {
  const envData = process.env.STUDENTS_DATA;

  if (envData) {
    try {
      return JSON.parse(envData) as StudentData[];
    } catch {
      console.error("Failed to parse STUDENTS_DATA env var");
    }
  }

  // 開発時フォールバック
  return sampleData as StudentData[];
}

/**
 * wallet addressから受講生を検索
 */
export async function getStudentByWallet(
  address: string
): Promise<StudentData | null> {
  const students = await getStudents();
  const normalized = address.toLowerCase();
  return (
    students.find((s) => s.walletAddress.toLowerCase() === normalized) ?? null
  );
}
