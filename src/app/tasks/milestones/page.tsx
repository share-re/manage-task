"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  customKindBadge,
  customKindLabel,
  usedCustomKinds,
  CUSTOM_KIND,
  MILESTONE_KIND_META,
  MILESTONE_KIND_ORDER,
  type Milestone,
  type MilestoneKind,
} from "@/lib/milestones";
import { getDefaultProjectId } from "@/lib/projects";
import ForestBackground from "@/components/ForestBackground";

// Badge color per kind (English code -> Tailwind classes).
const KIND_BADGE: Record<MilestoneKind, string> = {
  deadline: "bg-amber-100 text-amber-700",
  review: "bg-blue-100 text-blue-700",
  release: "bg-green-100 text-green-800",
};

function todayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

/**
 * マイルストーン (/tasks/milestones): 節目（納期/レビュー/リリース）の一覧＋
 * 登録/達成トグル/削除。達成は手動フラグ（着手前決定10）。恒久導線はフェーズ3の
 * サイドバー「マイルストーン」タブに寄せる予定で、当面はヘッダーからリンク。
 */
export default function MilestonesPage() {
  const [items, setItems] = useState<Milestone[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [today] = useState(todayIso);

  // New-milestone form.
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [kind, setKind] = useState<MilestoneKind>("deadline");
  /** 自由記述の種別名。空なら標準の3種（kind）を使う。 */
  const [customKind, setCustomKind] = useState("");
  /** 「＋ 新しく入力…」を選んだ直後だけ、名前の入力欄を出す。 */
  const [enteringKind, setEnteringKind] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listMilestones()
      .then(setItems)
      .catch((err) => {
        console.error(err);
        setError("マイルストーンの読み込みに失敗しました。");
      })
      .finally(() => setLoaded(true));
    getDefaultProjectId()
      .then(setProjectId)
      .catch((err) => console.error("案件の読み込みに失敗:", err));
  }, []);

  // 既に使われている自由記述の種別。実績のある名前だけが候補に並ぶ。
  const usedKinds = usedCustomKinds(items);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!title.trim() || !dueDate) return;
    setSaving(true);
    try {
      // 自由記述の種別は note に入れる（kind には check 制約があり増やせない）。
      // 標準の3種を選んだときは note を空にして、従来どおり kind で表示する。
      const custom = customKind.trim();
      const created = await createMilestone({
        title: title.trim(),
        dueDate,
        kind: custom ? CUSTOM_KIND : kind,
        note: custom || null,
        projectId,
      });
      setItems((prev) =>
        [...prev, created].sort((a, b) => a.due_date.localeCompare(b.due_date)),
      );
      setTitle("");
      setDueDate("");
    } catch (err) {
      console.error(err);
      setError("登録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(m: Milestone) {
    const next = !m.achieved;
    setItems((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, achieved: next } : x)),
    );
    try {
      await updateMilestone(m.id, { achieved: next });
    } catch (err) {
      console.error(err);
      setItems((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, achieved: m.achieved } : x)),
      );
      setError("更新に失敗しました。");
    }
  }

  async function onDelete(m: Milestone) {
    if (!window.confirm(`「${m.title}」を削除しますか？`)) return;
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== m.id));
    try {
      await deleteMilestone(m.id);
    } catch (err) {
      console.error(err);
      setItems(prev);
      setError("削除に失敗しました。");
    }
  }

  const inputClass =
    "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

  return (
    <div className="relative flex-1">
      <ForestBackground />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">マイルストーン</h1>
          <Link
            href="/tasks"
            className="text-sm hover:underline"
            style={{ color: "#3B6D11" }}
          >
            ← 進捗管理に戻る
          </Link>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {/* 登録フォーム */}
        <form
          onSubmit={onAdd}
          className="mb-4 rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5"
        >
          <div className="mb-2 text-sm font-semibold text-zinc-800">
            マイルストーンを追加
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="名称（例：本番リリース）"
              className={`${inputClass} flex-[2]`}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${inputClass} flex-1`}
            />
            {/* 種別：標準3種＋これまでに使われた自由記述。過去の入力が候補に出るので
                同じ種別を毎回打ち直さなくてよい。 */}
            <select
              value={customKind ? `c:${customKind}` : enteringKind ? "__new__" : kind}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__new__") {
                  setCustomKind("");
                  setEnteringKind(true);
                } else if (v.startsWith("c:")) {
                  setCustomKind(v.slice(2));
                  setEnteringKind(false);
                } else {
                  setCustomKind("");
                  setEnteringKind(false);
                  setKind(v as MilestoneKind);
                }
              }}
              className={`${inputClass} flex-1`}
            >
              {MILESTONE_KIND_ORDER.map((k) => (
                <option key={k} value={k}>
                  {MILESTONE_KIND_META[k].label}
                </option>
              ))}
              {usedKinds.map((label) => (
                <option key={label} value={`c:${label}`}>
                  {label}
                </option>
              ))}
              <option value="__new__">＋ 新しく入力…</option>
            </select>
            {(enteringKind || customKind) && (
              <input
                value={customKind}
                onChange={(e) => setCustomKind(e.target.value)}
                placeholder="種別名（例：サンプルローカル動作確認）"
                className={`${inputClass} flex-1`}
              />
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#3B6D11] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f5a0e] disabled:opacity-50"
            >
              追加
            </button>
          </div>
        </form>

        {/* 一覧 */}
        <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5">
          {!loaded ? (
            <p className="text-sm text-zinc-400">読み込み中…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-400">
              マイルストーンはまだありません。
            </p>
          ) : (
            items.map((m, i) => {
              const overdue = !m.achieved && m.due_date < today;
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 py-2.5 ${
                    i > 0 ? "border-t border-zinc-100" : ""
                  }`}
                >
                  {/* 自由記述の種別があればそれを出す。色は名前から機械的に決まるので、
                      同じ種別名はどの画面でも同じ色になる。 */}
                  {(() => {
                    const custom = customKindLabel(m.note);
                    const label = custom ?? MILESTONE_KIND_META[m.kind].label;
                    const badge = custom
                      ? customKindBadge(custom)
                      : KIND_BADGE[m.kind];
                    return (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge}`}
                      >
                        {label}
                      </span>
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm font-medium ${
                        m.achieved
                          ? "text-zinc-400 line-through"
                          : "text-zinc-900"
                      }`}
                    >
                      {m.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                      {m.due_date.replaceAll("-", "/")}
                      {overdue && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-medium text-red-700">
                          超過
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggle(m)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
                      m.achieved
                        ? "bg-green-100 text-green-800"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {m.achieved ? "✓ 達成" : "未達成"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(m)}
                    aria-label="削除"
                    className="shrink-0 rounded-full px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>

        <p className="mt-3 text-[11px] text-zinc-400">
          ※ 達成は手動で切り替えます（紐づくタスクの状態からは自動判定しません）。ガント上の旗印・タスク紐付けはフェーズ3で追加予定。
        </p>
      </main>
    </div>
  );
}
