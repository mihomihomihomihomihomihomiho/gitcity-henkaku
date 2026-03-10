import type { Metadata } from "next";
import dynamic from "next/dynamic";

const Providers = dynamic(() => import("./providers"), { ssr: false });

export const metadata: Metadata = {
  title: "GitCity Henkaku",
  description: "web3/AI概論 リーダーボード — アイソメトリック都市",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
