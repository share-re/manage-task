"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import TemplateModal from "./TemplateModal";

/**
 * Provisional left sidebar for the task screens, shaped after the design that
 * already exists on the real screen (案件 picker, then the section list, with
 * 管理 / ログアウト pinned to the bottom).
 *
 * Only 進捗管理, 定型タスク and 管理 do anything — the rest are placeholders so
 * the shape can be judged. When this meets the real sidebar, the single line
 * that needs carrying across is the 定型タスク entry and the modal it opens.
 */

type IconProps = { className?: string };

const Icon = {
  list: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...p}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  clock: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  gantt: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...p}>
      <path d="M4 7h10M8 12h12M4 17h7" />
    </svg>
  ),
  flag: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 21V4M5 4h11l-2 3 2 3H5" />
    </svg>
  ),
  chart: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...p}>
      <path d="M5 20V10M12 20V4M19 20v-6" />
    </svg>
  ),
  puzzle: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
      <path d="M11 7.5h4a2 2 0 0 1 2 2V13" />
    </svg>
  ),
  gear: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
    </svg>
  ),
  sprout: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 20v-7M12 13C12 9 9 7 5 7c0 4 3 6 7 6ZM12 13c0-3 2-5 6-5 0 3-2 5-6 5Z" />
    </svg>
  ),
};

// Sections the real sidebar carries. Only some exist here — the others have no
// href and render as placeholders rather than links to nowhere.
type Section = {
  key: string;
  label: string;
  icon: React.ComponentType<IconProps>;
  href?: string;
};

const SECTIONS: Section[] = [
  { key: "tasks", label: "進捗管理", icon: Icon.list, href: "/tasks" },
  { key: "hours", label: "工数入力", icon: Icon.clock },
  { key: "gantt", label: "ガントチャート", icon: Icon.gantt },
  { key: "milestone", label: "マイルストーン", icon: Icon.flag },
  { key: "dashboard", label: "ダッシュボード", icon: Icon.chart },
];

export default function TaskNav({ onGenerated }: { onGenerated?: () => void }) {
  const pathname = usePathname();
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const rowClass =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition";

  return (
    <>
      <aside className="w-full shrink-0 border-r border-zinc-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col">
        <div className="px-4 pb-2 pt-5">
          <p className="flex items-center gap-2 text-base font-bold text-zinc-900">
            <Icon.sprout className="h-5 w-5 text-[#3B6D11]" />
            進捗管理
          </p>
        </div>

        {/* 案件切替。値は既定案件のみで、切り替えはまだ効かない。 */}
        <div className="px-4 pb-3">
          <p className="mb-1 text-xs text-zinc-500">案件</p>
          <select
            disabled
            aria-label="案件"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 disabled:opacity-100"
          >
            <option>既定案件</option>
          </select>
          <p className="mt-1 text-[0.68rem] text-zinc-400">※次案件で有効化</p>
        </div>

        <nav aria-label="進捗管理メニュー" className="flex flex-col gap-0.5 px-2">
          {SECTIONS.map((s) => {
            const active = s.href ? pathname === s.href : false;
            const content = (
              <>
                <s.icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
                {s.label}
              </>
            );
            if (!s.href)
              return (
                <span
                  key={s.key}
                  title="このモックでは未実装です"
                  className={`${rowClass} cursor-default text-zinc-400`}
                >
                  {content}
                </span>
              );
            return (
              <Link
                key={s.key}
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={`${rowClass} ${
                  active
                    ? "bg-[#EAF3DE] text-[#173404]"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {content}
              </Link>
            );
          })}

          {/* 追加した項目。画面遷移せず、最前面にテンプレ一覧を出す。 */}
          <button
            type="button"
            onClick={() => setTemplatesOpen(true)}
            className={`${rowClass} text-zinc-600 hover:bg-zinc-50`}
          >
            <Icon.puzzle className="h-[1.05rem] w-[1.05rem] shrink-0" />
            定型タスク
          </button>
        </nav>

        {/* 管理・ログアウトは下端に寄せる（実画面と同じ位置）。 */}
        <div className="mt-auto flex flex-col gap-0.5 px-2 pb-5 pt-6">
          <Link
            href="/admin/users"
            className={`${rowClass} text-zinc-600 hover:bg-zinc-50`}
          >
            <Icon.gear className="h-[1.05rem] w-[1.05rem] shrink-0" />
            管理
          </Link>
          <span
            title="このモックでは未実装です"
            className={`${rowClass} cursor-default text-zinc-400`}
          >
            <span className="w-[1.05rem]" />
            ログアウト
          </span>
          <p className="px-3 pt-2 text-[0.65rem] leading-relaxed text-zinc-300">
            ※ 仮のサイドバーです。実装済みは 進捗管理・定型タスク・管理 のみ。
          </p>
        </div>
      </aside>

      <TemplateModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onGenerated={onGenerated}
      />
    </>
  );
}
