import type { GitHubActivity, StudentData } from "@/types";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CACHE_TTL = 30 * 60 * 1000; // 30分

// メモリキャッシュ
const cache = new Map<string, { data: GitHubActivity; expires: number }>();

/**
 * 単一リポジトリのGitHub活動を取得
 */
export async function getRepoActivity(
  owner: string,
  repo: string
): Promise<GitHubActivity> {
  const cacheKey = `${owner}/${repo}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  if (!GITHUB_TOKEN) {
    return generateMockActivity(owner);
  }

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
  };

  try {
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // commit数とPR数を並列取得
    const [commitsRes, prsRes, recentCommitsRes] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
        { headers }
      ),
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=1`,
        { headers }
      ),
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?since=${sevenDaysAgo}&per_page=100`,
        { headers }
      ),
    ]);

    // Link headerからトータルカウントを推定
    const commits = parseLinkCount(commitsRes.headers.get("link")) ?? 0;
    const pullRequests = parseLinkCount(prsRes.headers.get("link")) ?? 0;

    const recentCommits = recentCommitsRes.ok
      ? ((await recentCommitsRes.json()) as unknown[]).length
      : 0;

    // 直近7日の活動度 (0-1)。7日間で14コミット以上なら最大
    const recentActivity = Math.min(1, recentCommits / 14);

    const lastCommits = commitsRes.ok
      ? ((await commitsRes.json()) as { commit: { author: { date: string } } }[])
      : [];
    const lastActive =
      lastCommits.length > 0
        ? lastCommits[0].commit.author.date
        : null;

    const activity: GitHubActivity = {
      commits,
      pullRequests,
      recentActivity,
      lastActive,
    };

    cache.set(cacheKey, { data: activity, expires: Date.now() + CACHE_TTL });
    return activity;
  } catch (err) {
    console.error(`Failed to fetch GitHub activity for ${owner}/${repo}:`, err);
    return { commits: 0, pullRequests: 0, recentActivity: 0, lastActive: null };
  }
}

/**
 * 全受講生のGitHub活動を一括取得
 */
export async function getAllStudentActivities(
  students: StudentData[]
): Promise<Map<string, GitHubActivity>> {
  const results = new Map<string, GitHubActivity>();

  // 並列実行（ただしレート制限を考慮して10並列に制限）
  const batchSize = 10;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const activities = await Promise.all(
      batch.map((s) => {
        const parsed = parseRepoUrl(s.projectRepo);
        if (!parsed) {
          return Promise.resolve({
            studentId: s.id,
            activity: {
              commits: 0,
              pullRequests: 0,
              recentActivity: 0,
              lastActive: null,
            } as GitHubActivity,
          });
        }
        return getRepoActivity(parsed.owner, parsed.repo).then((activity) => ({
          studentId: s.id,
          activity,
        }));
      })
    );
    for (const { studentId, activity } of activities) {
      results.set(studentId, activity);
    }
  }

  return results;
}

// ---- ヘルパー ----

/**
 * GitHub Link headerからページ数（≒総数）を推定。
 * per_page=1の場合、最終ページ番号が総数。
 */
function parseLinkCount(linkHeader: string | null): number | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/page=(\d+)>; rel="last"/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * GitHubリポジトリURLからowner/repoを抽出
 */
function parseRepoUrl(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

// ---- モックデータ（開発用） ----

function generateMockActivity(owner: string): GitHubActivity {
  // ownerからシードを生成
  let seed = 0;
  for (let i = 0; i < owner.length; i++) {
    seed = (seed * 31 + owner.charCodeAt(i)) & 0xffffffff;
  }
  const commits = (seed % 50) + 5;
  const pullRequests = ((seed >> 4) % 12) + 1;
  const recentActivity = ((seed >> 8) % 10) / 10;

  return {
    commits,
    pullRequests,
    recentActivity,
    lastActive: new Date(Date.now() - ((seed % 7) * 86400000)).toISOString(),
  };
}
