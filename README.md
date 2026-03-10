# GitCity Henkaku

web3/AI概論の受講生アクティビティを**アイソメトリック都市**として可視化するリーダーボード。

受講生ごとにビルが建ち、トークン取得量・GitHub活動・貢献トークンの流通が街の景観に反映される。コースが進むほど街が活性化していく。

## 特徴

- **ビル** — 受講生ごとに1棟。高さ=トークン量、幅=commit数、窓の明かり=直近のGitHub活動
- **水路** — 貢献トークンの送受信がビル間の水路として流れる。太さ=流通量、色=新しさ
- **ウォレット認証** — MetaMask等で署名してログインすると、自分のビルがハイライト
- **受講生が拡張可能** — GitHub PRで新機能やビルスタイルを追加できる

## 技術スタック

- **フロントエンド**: Next.js (App Router) + TypeScript
- **描画**: Isomer.js (Canvas アイソメトリック描画)
- **認証**: RainbowKit + wagmi + SIWE (Sign-In with Ethereum) + next-auth
- **トークンデータ**: Alchemy API (Optimism チェーン)
- **GitHub連携**: GitHub REST API
- **デプロイ**: Vercel

## セットアップ

### 前提条件

- Node.js 20+
- npm

### インストール

```bash
git clone https://github.com/<your-org>/gitcity-henkaku.git
cd gitcity-henkaku
npm install
```

### 環境変数

`.env.example` をコピーして `.env.local` を作成:

```bash
cp .env.example .env.local
```

必要な値を設定する（詳細は `.env.example` 内のコメントを参照）。

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 で街が表示される。

開発時は `data/students.sample.json` のサンプルデータが使われる。

### その他のコマンド

```bash
npm run lint        # ESLint
npm run type-check  # TypeScript型チェック
npm run test        # テスト実行
npm run build       # プロダクションビルド
```

## 受講生データの登録

授業第1回のアンケート（manaba）で収集したwallet address + GitHubアカウントを登録する:

```bash
npx tsx scripts/import-students.ts <path-to-excel>
```

変換された `students.json` はVercel環境に配置する（リポジトリには含めない）。

詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照。

## コントリビューション

受講生による機能追加・改善を歓迎します。

**[CONTRIBUTING.md](CONTRIBUTING.md)** を読んでからPRを出してください。

## アーキテクチャ

システム構成やデータフローの詳細:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — システム構成、データフロー
- [docs/BUILDING-GUIDE.md](docs/BUILDING-GUIDE.md) — ビルのカスタマイズ方法

## ライセンス

MIT
