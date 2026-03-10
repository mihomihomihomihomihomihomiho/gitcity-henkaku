import type { TokenBalance, TokenTransfer } from "@/types";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ACHIEVEMENT_TOKEN = process.env.ACHIEVEMENT_TOKEN_ADDRESS;
const CONTRIBUTION_TOKEN = process.env.CONTRIBUTION_TOKEN_ADDRESS;
const ALCHEMY_BASE_URL = `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

/**
 * Alchemy APIでトークン残高を取得。
 * API未設定時はモックデータを返す。
 */
export async function getTokenBalances(
  wallets: string[]
): Promise<TokenBalance[]> {
  if (!ALCHEMY_API_KEY || !ACHIEVEMENT_TOKEN || !CONTRIBUTION_TOKEN) {
    return generateMockBalances(wallets);
  }

  const balances: TokenBalance[] = [];

  for (const wallet of wallets) {
    try {
      const res = await fetch(ALCHEMY_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getTokenBalances",
          params: [wallet, [ACHIEVEMENT_TOKEN, CONTRIBUTION_TOKEN]],
        }),
      });

      const data = await res.json();
      const tokenBalances = data.result?.tokenBalances ?? [];

      const achievement = parseTokenAmount(
        tokenBalances.find(
          (t: { contractAddress: string }) =>
            t.contractAddress.toLowerCase() === ACHIEVEMENT_TOKEN!.toLowerCase()
        )?.tokenBalance
      );
      const contribution = parseTokenAmount(
        tokenBalances.find(
          (t: { contractAddress: string }) =>
            t.contractAddress.toLowerCase() ===
            CONTRIBUTION_TOKEN!.toLowerCase()
        )?.tokenBalance
      );

      balances.push({
        walletAddress: wallet,
        achievement,
        contribution,
        total: achievement + contribution,
      });
    } catch (err) {
      console.error(`Failed to fetch balance for ${wallet}:`, err);
      balances.push({
        walletAddress: wallet,
        achievement: 0,
        contribution: 0,
        total: 0,
      });
    }
  }

  return balances;
}

/**
 * 貢献トークンのTransfer履歴を取得（水路データ用）。
 */
export async function getTransferHistory(): Promise<TokenTransfer[]> {
  if (!ALCHEMY_API_KEY || !CONTRIBUTION_TOKEN) {
    return generateMockTransfers();
  }

  try {
    const res = await fetch(ALCHEMY_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromBlock: "0x0",
            toBlock: "latest",
            contractAddresses: [CONTRIBUTION_TOKEN],
            category: ["erc20"],
            withMetadata: true,
            order: "desc",
            maxCount: "0x3E8", // 1000件
          },
        ],
      }),
    });

    const data = await res.json();
    const transfers = data.result?.transfers ?? [];

    return transfers.map(
      (t: {
        from: string;
        to: string;
        value: number;
        metadata: { blockTimestamp: string };
        hash: string;
      }) => ({
        from: t.from,
        to: t.to,
        amount: t.value ?? 0,
        tokenType: "contribution" as const,
        timestamp: t.metadata?.blockTimestamp ?? new Date().toISOString(),
        txHash: t.hash,
      })
    );
  } catch (err) {
    console.error("Failed to fetch transfer history:", err);
    return [];
  }
}

// ---- ヘルパー ----

function parseTokenAmount(hex: string | undefined): number {
  if (!hex || hex === "0x") return 0;
  // ERC-20は通常18 decimals
  const raw = BigInt(hex);
  return Number(raw / BigInt(10 ** 18));
}

// ---- モックデータ（開発用） ----

function generateMockBalances(wallets: string[]): TokenBalance[] {
  // 擬似ランダム（walletアドレスからシード）
  return wallets.map((wallet) => {
    const seed = parseInt(wallet.slice(2, 10), 16);
    const achievement = (seed % 80) + 5;
    const contribution = ((seed >> 8) % 40) + 2;
    return {
      walletAddress: wallet,
      achievement,
      contribution,
      total: achievement + contribution,
    };
  });
}

function generateMockTransfers(): TokenTransfer[] {
  // サンプルの送受信データ
  const pairs = [
    ["0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222", 15],
    ["0x2222222222222222222222222222222222222222", "0x3333333333333333333333333333333333333333", 8],
    ["0x1111111111111111111111111111111111111111", "0x4444444444444444444444444444444444444444", 12],
    ["0x3333333333333333333333333333333333333333", "0x5555555555555555555555555555555555555555", 5],
    ["0x4444444444444444444444444444444444444444", "0x2222222222222222222222222222222222222222", 10],
    ["0x6666666666666666666666666666666666666666", "0x1111111111111111111111111111111111111111", 7],
    ["0x2222222222222222222222222222222222222222", "0x7777777777777777777777777777777777777777", 3],
    ["0x5555555555555555555555555555555555555555", "0x6666666666666666666666666666666666666666", 6],
  ] as const;

  return pairs.map(([from, to, amount], i) => ({
    from,
    to,
    amount,
    tokenType: "contribution" as const,
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    txHash: `0xmock${i.toString().padStart(62, "0")}`,
  }));
}
