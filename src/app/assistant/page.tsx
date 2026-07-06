import Link from "next/link";

// AI内田さん（担当があとで中身を作る仮ページ）
export default function AssistantPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-6">
      <h1 className="text-2xl font-bold text-zinc-900">AI内田さん（準備中）</h1>
      <p className="mt-2 text-sm text-zinc-500">この機能はこれから担当者が作ります。</p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm text-emerald-700 hover:underline"
      >
        ← トップに戻る
      </Link>
    </div>
  );
}
