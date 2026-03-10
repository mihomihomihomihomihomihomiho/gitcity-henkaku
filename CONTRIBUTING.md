# コントリビューションガイド

GitCity Henkakuは受講生のPRによる機能追加・改善を歓迎します。

## はじめに

### 1. リポジトリをフォーク

GitHub上で「Fork」ボタンをクリックして、自分のアカウントにコピーを作成する。

### 2. ローカルにクローン

```bash
git clone https://github.com/<あなたのユーザー名>/gitcity-henkaku.git
cd gitcity-henkaku
npm install
```

### 3. 環境変数を設定

```bash
cp .env.example .env.local
```

開発時はサンプルデータで動くため、API キーがなくても基本的な表示は確認できる。

### 4. 開発サーバーを起動

```bash
npm run dev
```

http://localhost:3000 で街が表示される。`data/students.sample.json` のサンプルデータが使われる。

## PRの出し方

### 1. ブランチを作成

```bash
git checkout -b feature/your-feature-name
```

ブランチ名の例:
- `feature/dark-mode` — 新機能
- `fix/tooltip-position` — バグ修正
- `style/neon-building` — ビルスタイルの追加

### 2. 変更を加える

コードを変更したら、以下を確認:

```bash
npm run lint        # コード品質チェック
npm run type-check  # 型チェック
npm run build       # ビルドが通るか確認
```

### 3. コミットしてプッシュ

```bash
git add .
git commit -m "feat: ダークモードを追加"
git push origin feature/your-feature-name
```

### 4. PRを作成

GitHub上でPRを作成する。テンプレートに従って以下を記入:
- 何を変更したか
- 動作確認のチェックリスト
- スクリーンショット（街の見た目が変わる場合）

### 5. CIチェックとレビュー

PRを出すと自動で以下が実行される:
- **GitHub Actions** — ビルド、Lint、型チェック、テスト
- **Vercel Preview** — PRごとにプレビューURLが生成される

全てのチェックが通ったら、運営がレビューしてマージする。

## 何を追加できる？

### ビルスタイル

ビルの見た目をカスタマイズするスタイルを追加できる。詳細は [docs/BUILDING-GUIDE.md](docs/BUILDING-GUIDE.md) を参照。

### 新機能の例

- ダークモード/テーマ切り替え
- ビルのアニメーション効果
- 水路のアニメーション強化
- 統計ダッシュボードの改善
- モバイル向けUI改善

### バグ修正

問題を見つけたら、Issueを作成するか直接PRで修正してください。

## コーディング規約

- **TypeScript** を使用する（`any` は避ける）
- **ESLint** のルールに従う（`npm run lint` で確認）
- コンポーネントは `src/components/` に配置
- ユーティリティは `src/lib/` に配置
- 型定義は `src/types/` に配置

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router（ページ・API）
├── components/
│   ├── city/               # City描画関連
│   ├── dashboard/          # リーダーボード関連
│   └── shared/             # 共通コンポーネント
├── lib/                    # ユーティリティ・ビジネスロジック
├── types/                  # TypeScript型定義
├── data/                   # サンプルデータ
└── scripts/                # CLIツール
```

## 困ったら

- PRのCIが失敗したら → エラーメッセージを確認して修正
- レビューでコメントがついたら → 修正してプッシュ（PRは自動更新される）
- わからないことがあったら → Issueで質問してください
