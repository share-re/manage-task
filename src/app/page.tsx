"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

// 各機能への入口カードのデータ（飛び先は仮のパス。中身は各担当があとで作る）
const FEATURES = [
  { href: "/tasks", emoji: "✅", title: "進捗管理", desc: "タスクや作業状況を管理します。" },
  { href: "/assistant", emoji: "🤖", title: "AI内田さん", desc: "困ったときに相談できるAIです。" },
  { href: "/forest", emoji: "🌱", title: "植林", desc: "進捗が進むほど緑が育ちます。" },
];

// 仮の進捗データ（本来は「進捗管理」機能から受け取る。今は画面確認用のサンプル）
const SAMPLE_PROGRESS = { done: 3, total: 10 };

// 達成数に応じた「植林（森）の様子」の一言（本来は「植林」機能と連動）
// (done: number) = 引数 done は数値、: string = この関数は文字列を返す、というTypeScriptの型注釈
function forestMessage(done: number): string {
  if (done <= 0) return "まだ何も植わっていません。最初のタスクを完了してみましょう。";
  if (done < 5) return "苗木がすくすく育っています。🌱";
  if (done < 10) return "若木が並び、緑がにぎやかになってきました。🌿";
  return "森が生い茂りました！みんなの頑張りの成果です。🌳";
}

export default function HomePage() {
  const router = useRouter();
  const { session } = useAuth();

  async function onLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const { done, total } = SAMPLE_PROGRESS;
  const percent = Math.round((done / total) * 100);

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 pt-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-zinc-900">
            進捗管理
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {session?.user.email} でログイン中
          </p>
        </div>
        <button
          onClick={onLogout}
          className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100"
        >
          ログアウト
        </button>
      </header>

      {/* 各機能への入口（導線）。カードごと押せるリンクにする */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-2xl">{f.emoji}</span>
            <h2 className="mt-2 font-bold text-zinc-900">{f.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{f.desc}</p>
          </Link>
        ))}
      </section>

      {/* 今日のようす（現在の進捗・植林の様子）。今は仮の数値。 */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">今日のようす</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">現在の進捗</p>
            <p className="mt-1 text-zinc-800">
              {done} / {total} タスク完了（{percent}%）
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">🌱 植林の様子</p>
            <p className="mt-1 text-zinc-800">{forestMessage(done)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          ※ 今は仮の数値です。進捗管理・植林の機能ができると、ここに実際の状況が反映されます。
        </p>
      </section>
    </div>
  );
}
