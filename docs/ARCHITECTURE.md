# アーキテクチャ

GitCity Henkakuのシステム構成とデータフロー。

## 全体構成

```
┌────────────────────────────────────────────────────────────┐
│                      Next.js App (Vercel)                   │
│                                                            │
│  ┌────────────────┐                                        │
│  │ Wallet Auth    │  ← RainbowKit + SIWE                  │
│  │ (MetaMask等)   │    ウォレット署名でログイン              │
│  └───────┬────────┘    → 自分のビルがハイライト              │
│          ↓                                                  │
│  ┌──────────────┐  ┌─────────────────────────────┐         │
│  │ Dashboard    │  │  CityView                    │        │
│  │ (リーダー    │  │  (Isomer.js Canvas)           │        │
│  │  ボード)     │  │  ┌─────────────────────────┐ │        │
│  │              │  │  │ Buildings (受講生ビル)   │ │        │
│  │              │  │  │ Waterways (トークン水路) │ │        │
│  │              │  │  │ Tooltips (情報表示)      │ │        │
│  └──────┬───────┘  └──────────┬──────────────────┘         │
│         │                     │                             │
│  ┌──────┴─────────────────────┴──────────────────┐         │
│  │           Data Layer (API Routes)              │         │
│  │  /api/students  /api/tokens  /api/city         │         │
│  │  /api/transfers  /api/auth                     │         │
│  └──────┬───────────────┬────────────────┬───────┘         │
└─────────┼───────────────┼────────────────┼──────────────────┘
          ↓               ↓                ↓
┌─────────────────┐ ┌──────────┐ ┌─────────────────────┐
│ Optimism Chain  │ │ GitHub   │ │ Student Registry     │
│ (Alchemy API)   │ │ API      │ │ (Vercel環境変数/Blob)│
│ ・トークン残高   │ │ (受講生  │ │ ・wallet address     │
│ ・Transfer履歴  │ │  リポ)   │ │ ・GitHub username     │
└─────────────────┘ └──────────┘ └─────────────────────┘
```

## データフロー

### トークンデータ（Optimism → City）

1. Alchemy API で Optimism チェーンからトークン残高を取得（`alchemy_getTokenBalances`）
2. Transfer履歴を取得（`alchemy_getAssetTransfers`）
3. `token-provider.ts` がデータを整形
4. `city-math.ts` がトークン量をビルの高さ・色に変換
5. `waterway-builder.ts` がTransfer履歴を水路データに変換

### GitHub データ（GitHub API → City）

1. GitHub REST API で受講生リポの活動を取得
2. `github.ts` が commit数、PR数、直近の活動を整形
3. `city-math.ts` が commit数→ビルの幅、PR数→奥行き、活動度→窓の明かりに変換

### 受講生データ登録（manaba → Vercel）

```
manaba アンケート → Excel出力 → import-students.ts → students.json → Vercel環境
```

## モジュール構成

```
src/
├── app/                       # Next.js App Router
│   ├── page.tsx              # メインページ（City表示）
│   ├── layout.tsx            # 共通レイアウト
│   ├── dashboard/            # リーダーボード
│   └── api/
│       ├── students/         # 受講生データAPI
│       ├── tokens/           # トークンデータAPI
│       ├── transfers/        # 送受信履歴API（水路データ）
│       ├── city/             # City描画用データAPI（ビル+水路統合）
│       └── auth/             # NextAuth + SIWE
│
├── components/
│   ├── city/
│   │   ├── CityCanvas.tsx        # Isomer.jsでのCity描画
│   │   ├── Building.ts           # ビル計算ロジック
│   │   ├── CityLayout.ts         # スパイラル配置アルゴリズム
│   │   ├── WaterwayRenderer.ts   # 水路描画
│   │   └── CityTooltip.tsx       # ホバー時の情報表示
│   ├── dashboard/
│   │   ├── Leaderboard.tsx       # ランキング表
│   │   └── StatsCard.tsx         # 統計カード
│   └── shared/
│       ├── Header.tsx            # 共通ヘッダー
│       └── ConnectWallet.tsx     # ウォレット接続ボタン
│
├── lib/
│   ├── token-provider.ts         # Alchemy APIでトークンデータ取得
│   ├── waterway-builder.ts       # Transfer履歴 → Waterway[] 変換
│   ├── github.ts                 # GitHub API連携
│   ├── city-math.ts              # データ→ビル属性の変換
│   ├── students.ts               # 受講生データの読み込み
│   └── auth.ts                   # SIWE認証ロジック
│
├── types/
│   └── index.ts                  # 共通型定義
│
├── data/
│   └── students.sample.json      # 開発用サンプルデータ
│
└── scripts/
    └── import-students.ts         # manaba Excel → students.json 変換
```

## ビルのマッピング

| ビルの属性 | データソース | 計算方法 |
|-----------|------------|---------|
| 高さ | トークン総数（Optimism） | `BASE + tokens.total * SCALE` (上限あり) |
| 幅 | GitHub commit数 | `BASE_WIDTH + commits * WIDTH_SCALE` |
| 奥行き | GitHub PR数 | `BASE_DEPTH + prs * DEPTH_SCALE` |
| 色 | トークン量 | グラデーション（多い=鮮やか、少ない=淡い） |
| 窓の明かり | 直近のGitHub活動 | 直近7日のcommit/PR → 明るさ（0-1） |
| ラベル | GitHubユーザー名 | そのまま表示 |

## 水路システム

貢献トークン（ERC-20）の送受信をビル間の水路として描画する。

### データ取得

Alchemy API の `alchemy_getAssetTransfers` で貢献トークンのTransfer履歴を一括取得。

### 水路の属性

| 属性 | データソース | 意味 |
|------|------------|------|
| 太さ | 累計送信トークン数 | たくさん送り合うほど太い水路 |
| 色/透明度 | 最後の送信からの経過時間 | 最近の流通ほど鮮やか |
| 方向 | from → to | トークンの流れが見える |
| 双方向表示 | 相互送信の有無 | お互いに送り合っている関係 |

### 生成ロジック

1. Transfer履歴を from-to ペアで集約
2. 各ペアの累計量・直近量を計算
3. ビルの位置座標を紐付け
4. 最小流通量以下は非表示（ノイズ除去）

## 認証（SIWE）

ウォレット署名によるログイン。認証は任意で、ログインしなくても街全体は閲覧可能。

```
サイトにアクセス（認証なしでも閲覧可能）
    ↓
「ウォレットで接続」ボタン（RainbowKit）
    ↓
MetaMask等がポップアップ
    ↓
メッセージに署名（ガス代ゼロ）
    ↓
サーバーが署名を検証 → wallet addressでユーザー特定
    ↓
自分のビルがハイライト + 自分の水路が強調
```

## データプライバシー

受講生の個人情報（名前 ↔ wallet address の紐付け）はリポジトリに含めない。

- **リポジトリ（公開）**: アプリコード、サンプルデータ、ドキュメント
- **Vercel環境（非公開）**: `students.json`（実データ）

受講生はコード全体を見てPRできるが、他の受講生の個人情報は見えない。

## 外部サービス

| サービス | 用途 | 備考 |
|---------|------|------|
| Alchemy | Optimismトークンデータ | 無料枠（月300M CU）で十分 |
| GitHub API | 受講生リポの活動 | 認証ありで5,000req/時 |
| Vercel | ホスティング + Preview Deploy | PRごとにプレビューURL生成 |
| RainbowKit | ウォレット接続UI | MetaMask, Coinbase Wallet等対応 |
