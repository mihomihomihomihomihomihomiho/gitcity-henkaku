"use client";

import ConnectWallet from "./ConnectWallet";

export default function Header() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        background: "#12122a",
        borderBottom: "1px solid #2a2a4a",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 20, color: "#e0e0e0" }}>
          GitCity Henkaku
        </h1>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.5, color: "#e0e0e0" }}>
          web3/AI概論 リーダーボード
        </p>
      </div>
      <ConnectWallet />
    </header>
  );
}
