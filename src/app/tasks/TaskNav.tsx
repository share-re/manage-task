"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Provisional left sidebar for the task screens.
 *
 * The real screen already has one (案件 picker, 進捗管理 / 工数入力 / ガント
 * チャート / マイルストーン / ダッシュボード). This is a stand-in so the 定型
 * タスク entry has somewhere to live until the two are merged — at which point
 * only the ITEMS below need moving across, since each is just a link.
 */

const ITEMS = [
  { href: "/tasks", emoji: "📋", label: "進捗管理" },
  { href: "/tasks/templates", emoji: "🧩", label: "定型タスク" },
];

export default function TaskNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 px-4 pt-8 lg:w-56 lg:px-0 lg:pl-4">
      <nav
        aria-label="進捗管理メニュー"
        className="rounded-xl border border-[#C0DD97] bg-white/90 p-2 shadow-sm"
      >
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[#EAF3DE] text-[#173404]"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <span className="w-[1.15em] text-center">{item.emoji}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="mt-2 px-1 text-[0.68rem] leading-relaxed text-zinc-400">
        ※ 仮のサイドバーです。本来のメニュー（案件切替・工数入力・ガントチャート等）に
        「定型タスク」を1項目足す想定です。
      </p>
    </aside>
  );
}
