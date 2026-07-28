"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationText,
  relativeTime,
  unreadCount,
  type AppNotification,
} from "@/lib/notifications";

/**
 * 通知ベル（サイドバー上部）。未読数バッジ＋ドロップダウン。
 *
 * アプリを開いている間は Realtime で自分宛の新着を拾って未読が増える。閉じていた
 * 間の分は、次に開いたときの初回取得でまとめて出る。
 *
 * 取得に失敗したときは未読数を出さない（「通知ゼロ」と同じ見た目にしないため、
 * ベルに「!?」を出して再読込できるようにする）。
 */
export default function NotificationBell() {
  const { session } = useAuth();
  const uid = session?.user?.id ?? null;
  const router = useRouter();

  // 取得結果は「誰の分か」を一緒に持つ。ログインし直した直後に前のユーザーの通知が
  // 一瞬見えるのを防げるうえ、effect の中で同期的に state を消す必要もなくなる。
  const [data, setData] = useState<{
    uid: string;
    rows: AppNotification[];
  } | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const list = data && data.uid === uid ? data.rows : [];
  const failed = !!uid && failedFor === uid;

  const load = useCallback(() => {
    if (!uid) return;
    listNotifications()
      .then((rows) => {
        setData({ uid, rows });
        setFailedFor(null);
      })
      .catch((err) => {
        console.error("通知の読み込みに失敗:", err);
        setFailedFor(uid);
      });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    load();
    // 自分宛の新着だけを購読する（他人の通知は RLS でも弾かれるが、無駄な再取得も避ける）。
    const channel = supabase
      .channel(`notifications:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${uid}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, load]);

  // 外側クリックで閉じる。
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (!uid) return null;

  const unread = unreadCount(list);

  async function onClickRow(n: AppNotification) {
    setOpen(false);
    // 先に画面上で既読にしてから保存する（失敗したら取り直す）。
    setData((prev) =>
      prev
        ? {
            ...prev,
            rows: prev.rows.map((x) =>
              x.id === n.id ? { ...x, read: true } : x,
            ),
          }
        : prev,
    );
    try {
      if (!n.read) await markNotificationRead(n.id);
    } catch (err) {
      console.error("既読にできませんでした:", err);
      load();
    }
    router.push("/tasks");
  }

  async function onMarkAll() {
    const before = data;
    setData((prev) =>
      prev
        ? { ...prev, rows: prev.rows.map((x) => ({ ...x, read: true })) }
        : prev,
    );
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error("すべて既読にできませんでした:", err);
      setData(before);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => (failed ? load() : setOpen((v) => !v))}
        aria-label={failed ? "通知（読み込めませんでした）" : "通知"}
        aria-expanded={open}
        title={failed ? "通知を読み込めませんでした（クリックで再読込）" : "通知"}
        className="relative rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
      >
        <BellIcon />
        {failed ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-zinc-200 px-1 text-[9px] font-bold leading-[14px] text-zinc-600">
            !?
          </span>
        ) : unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[15px] rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-[15px] text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[272px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
            <span className="text-[13px] font-semibold text-zinc-800">通知</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-[11px] text-[#3B6D11] hover:underline"
              >
                すべて既読
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <p className="px-3 py-5 text-center text-xs text-zinc-400">
              通知はありません。
            </p>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onClickRow(n)}
                    className={`flex w-full items-start gap-2 border-t border-zinc-100 px-3 py-2 text-left first:border-t-0 hover:bg-zinc-50 ${
                      n.read ? "bg-white" : "bg-[#FAFDF5]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        n.read ? "bg-transparent" : "bg-[#3B6D11]"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[12.5px] leading-snug ${
                          n.read
                            ? "font-normal text-zinc-500"
                            : "font-medium text-zinc-800"
                        }`}
                      >
                        {notificationText(n)}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-zinc-400">
                        {relativeTime(n.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// サイドバーの他のアイコンと同じくインラインSVG（アイコンフォントは読み込んでいない）。
function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 5a2 2 0 1 1 4 0 7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </svg>
  );
}
