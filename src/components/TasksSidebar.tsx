"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { isAdmin } from "@/lib/roles";
import LogoutButton from "./LogoutButton";
import NotificationBell from "./NotificationBell";

// Common left navigation for all /tasks pages (要確認-10 / フェーズ2 Step 10).
// Icons are inline SVG because the app doesn't load the Tabler icon font.

const NAV: { href: string; label: string; icon: React.FC }[] = [
  { href: "/tasks", label: "進捗管理", icon: IconList },
  // 「品質」タブはここに入る予定（品質機能の実装PRで追加する）。
  { href: "/tasks/time-entry", label: "工数入力", icon: IconClock },
  { href: "/tasks/dashboard", label: "ダッシュボード", icon: IconChart },
  { href: "/tasks/gantt", label: "ガントチャート", icon: IconGantt },
  { href: "/tasks/milestones", label: "マイルストーン", icon: IconFlag },
];

export default function TasksSidebar() {
  const pathname = usePathname();
  const { session, profileName } = useAuth();
  const admin = isAdmin(session);
  const name =
    profileName ||
    (session?.user?.user_metadata?.name as string | undefined) ||
    session?.user?.email ||
    "ユーザー";
  const initial = name.trim().charAt(0) || "?";

  return (
    <aside className="sticky top-0 flex h-screen w-[184px] shrink-0 flex-col self-start border-r border-black/10 bg-white px-2.5 py-3.5">
      <div className="flex items-center justify-between px-1.5 pb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: "#3B6D11" }}>
            <IconSprout />
          </span>
          <span className="text-sm font-medium text-zinc-800">進捗管理</span>
        </div>
        <NotificationBell />
      </div>

      {/* 案件切り替え（枠のみ・切替とRLSは後フェーズ） */}
      <div className="px-1.5 pb-1 text-[11px] text-zinc-400">案件</div>
      <button
        type="button"
        disabled
        aria-label="案件（次案件で有効化）"
        className="mb-0.5 flex w-full items-center justify-between rounded-lg border border-black/10 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-700"
      >
        <span className="truncate">既定案件</span>
        <IconChevron />
      </button>
      <div className="px-1.5 pb-3 text-[10px] text-zinc-400">※次案件で有効化</div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${
                active
                  ? "bg-[#EAF3DE] text-[#27500A]"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-black/10 pt-2.5">
        {admin && (
          <Link
            href="/admin/users"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-100"
          >
            <IconGear />
            管理
          </Link>
        )}
        <div className="flex items-center gap-2 px-1.5 pt-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAF3DE] text-[11px] font-medium text-[#27500A]">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs text-zinc-800">{name}</div>
            <LogoutButton className="text-[11px] text-zinc-400 hover:underline" />
          </div>
        </div>
      </div>
    </aside>
  );
}

// --- inline SVG icons (17px, inherit color) ---

function svgProps(stroke = true) {
  return {
    viewBox: "0 0 24 24",
    width: 17,
    height: 17,
    "aria-hidden": true,
    ...(stroke
      ? {
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2,
          strokeLinecap: "round" as const,
          strokeLinejoin: "round" as const,
        }
      : { fill: "currentColor" }),
  };
}

function IconList() {
  return (
    <svg {...svgProps()}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function IconGantt() {
  return (
    <svg {...svgProps(false)}>
      <rect x="3" y="5" width="10" height="3" rx="1.2" />
      <rect x="7" y="10.5" width="12" height="3" rx="1.2" />
      <rect x="5" y="16" width="8" height="3" rx="1.2" />
    </svg>
  );
}

function IconFlag() {
  return (
    <svg {...svgProps(false)}>
      <path d="M6 3a1 1 0 0 1 1 1v1h11l-2 3 2 3H7v9a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg {...svgProps(false)}>
      <rect x="4" y="12" width="3.4" height="7" rx="0.8" />
      <rect x="10.3" y="8" width="3.4" height="11" rx="0.8" />
      <rect x="16.6" y="4" width="3.4" height="15" rx="0.8" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg {...svgProps()}>
      <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
      <circle cx="15" cy="8" r="2.2" />
      <circle cx="9" cy="16" r="2.2" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconSprout() {
  return (
    <svg viewBox="0 0 24 24" width={19} height={19} aria-hidden fill="currentColor">
      <path d="M12 22v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M12 14C12 10 9 8 4 8c0 4 3 6 8 6Z" />
      <path d="M12 13c0-3 2.5-5 7-5 0 3.5-2.5 5-7 5Z" />
    </svg>
  );
}
