import Link from "next/link";

// AI内田さん（担当があとで中身を作る仮ページ）
export default function AssistantPage() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <h1>AI内田さん（準備中）</h1>
      <p>この機能はこれから担当者が作ります。</p>
      <Link href="/">← トップに戻る</Link>
    </main>
  );
}
