import Link from "next/link";

// 植林（担当があとで中身を作る仮ページ）
//
// ▼ この画面で作るもの（担当への申し送り）
//   進捗の達成数に応じて、この画面全体の緑（草・木・花など）が
//   だんだん豊かに育っていく演出をここに実装する。
//   （1本を育てるのではなく、画面全体が緑になっていくイメージ）
//   達成数は「進捗管理」機能のデータを受け取って使う想定。
export default function ForestPage() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <h1>植林（準備中）</h1>
      <p>この機能はこれから担当者が作ります。</p>
      <p>進捗が進むほど、この画面全体の緑が育っていく予定です。</p>
      <Link href="/">← トップに戻る</Link>
    </main>
  );
}
