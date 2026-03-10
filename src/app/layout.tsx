import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
