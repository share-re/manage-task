import Link from "next/link";

// AI内田さん (placeholder page; the owner will build the real feature later).
export default function AssistantPage() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <h1>AI内田さん（準備中）</h1>
      <p>この機能はこれから担当者が作ります。</p>
      <Link
        href="/office"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "#3B6D11",
          textDecoration: "none",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          width={16}
          height={16}
          aria-hidden="true"
        >
          <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17" />
          <path d="M15 8h4a1 1 0 0 1 1 1v12" />
          <path d="M3 21h18" />
          <path d="M8 7h3M8 11h3M8 15h3" />
        </svg>
        オフィスへ
      </Link>
    </main>
  );
}
