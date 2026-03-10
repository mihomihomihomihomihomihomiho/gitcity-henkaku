#!/usr/bin/env npx tsx
/**
 * manaba Excel → students.json 変換スクリプト
 *
 * 使用方法:
 *   npx tsx scripts/import-students.ts <input.xlsx> [output.json]
 *
 * Excel列マッピング（デフォルト）:
 *   A列: 名前
 *   B列: wallet address (0x...)
 *   C列: GitHub username
 *   D列: プロジェクトリポジトリURL
 *
 * 1行目はヘッダーとしてスキップ。
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

interface StudentRow {
  name: string;
  walletAddress: string;
  githubUsername: string;
  projectRepo: string;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: npx tsx scripts/import-students.ts <input.xlsx> [output.json]");
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] ?? "data/students.json";

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Reading: ${inputPath}`);
  const workbook = XLSX.readFile(inputPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    header: ["name", "walletAddress", "githubUsername", "projectRepo"],
    range: 1, // ヘッダー行スキップ
  });

  console.log(`Found ${rows.length} rows`);

  const students: StudentRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // Excel行番号（ヘッダー=1、データ=2〜）

    // バリデーション
    if (!row.name?.trim()) {
      errors.push(`Row ${lineNum}: 名前が空です`);
      continue;
    }
    if (!row.walletAddress?.trim()) {
      errors.push(`Row ${lineNum}: wallet addressが空です`);
      continue;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(row.walletAddress.trim())) {
      errors.push(
        `Row ${lineNum}: wallet addressのフォーマットが不正です: ${row.walletAddress}`
      );
      continue;
    }
    if (!row.githubUsername?.trim()) {
      errors.push(`Row ${lineNum}: GitHub usernameが空です`);
      continue;
    }

    students.push({
      name: row.name.trim(),
      walletAddress: row.walletAddress.trim().toLowerCase(),
      githubUsername: row.githubUsername.trim(),
      projectRepo: row.projectRepo?.trim() ?? "",
    });
  }

  // エラー表示
  if (errors.length > 0) {
    console.error(`\n${errors.length} errors found:`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
  }

  // ID付与して出力
  const output = students.map((s, i) => ({
    id: `student-${String(i + 1).padStart(3, "0")}`,
    ...s,
  }));

  // 出力ディレクトリ作成
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
  console.log(`\nWrote ${output.length} students to ${outputPath}`);

  if (errors.length > 0) {
    console.log(`(${errors.length} rows skipped due to errors)`);
    process.exit(1);
  }
}

main();
