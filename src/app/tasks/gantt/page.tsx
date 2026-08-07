"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listTasks,
  buildTaskTree,
  resolveAssigneeLabel,
  STATUS_META,
  STATUS_ORDER,
  type Task,
  type TaskStatus,
} from "@/lib/tasks";
import { listMembers, memberLabel, type Member } from "@/lib/members";
import {
  listMilestones,
  MILESTONE_KIND_META,
  type Milestone,
} from "@/lib/milestones";
import ForestBackground from "@/components/ForestBackground";

// Layout constants (px). Kept in one place so the left columns, the day grid,
// and the bars can never drift apart.
const DW = 24; // width of one day column
const MH = 18; // month header row
const DH = 20; // day-number row
const FH = 26; // feature (parent) row
const LH = 30; // leaf (task) row
// 作業名は「単体テスト仕様書レビュー」程度が切れずに入る幅。左4列は横スクロール中も
// sticky で固定されるので、広げても日付側の操作の邪魔にはならない。
const NAMEW = 320;
const WHOW = 100; // 「柴田_1」のような接尾辞つきの名前が入る幅
const SW = 70;
const EW = 70;
const LABEL = NAMEW + WHOW + SW + EW;
const GL = "#dcdcd6"; // grid line
const GH = "#cbcbc3"; // heavier line (column/header separators)
const WE = "#efeee7"; // weekend shade
const DAYMS = 86_400_000;

function toMs(d: string): number {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}
function todayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function md(d: string | null): string {
  return d ? d.slice(5).replace("-", "/") : "";
}

type Row =
  | { kind: "feature"; label: string }
  | { kind: "leaf"; task: Task; label: string };

// Bar color follows delay, not status detail: overdue = red, done = gray,
// otherwise green (in-progress / upcoming).
function barColor(task: Task, base: string): string {
  if (task.status === "done") return "#b8b6ad";
  if (task.due_date && task.due_date < base) return "#e07a78";
  return "#7cae4c";
}

/**
 * ガント (/tasks/gantt): 方眼の上にタスクを開始日〜期限の横棒で並べる読み取りビュー。
 * 左は作業名/担当者/開始日/終了日の4列、機能（親タスク）でグルーピング。日付は進捗管理と
 * 連動（ここでは編集しない）。依存の矢印・稲妻線は後回し（PR1でテーブル・関数は作成済み）。
 */
export default function GanttPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [baseDate, setBaseDate] = useState(todayIso);
  const [search, setSearch] = useState("");
  const [filterAssigneeId, setFilterAssigneeId] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | TaskStatus>("");
  const [showLightning, setShowLightning] = useState(true);

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((err) => {
        console.error(err);
        setError("タスクの読み込みに失敗しました。");
      })
      .finally(() => setLoaded(true));
    listMembers()
      .then(setMembers)
      .catch((err) => console.error("メンバー一覧の読み込みに失敗:", err));
    listMilestones()
      .then(setMilestones)
      .catch((err) => console.error("マイルストーンの読み込みに失敗:", err));
  }, []);

  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const mem of members) m.set(mem.id, memberLabel(mem));
    return m;
  }, [members]);

  // Group into feature (parent) rows + their leaf rows; standalone leaves go
  // under a「（親なし）」group at the end. Search / assignee / status filter the
  // leaves; a feature row is kept only when at least one child survives.
  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase();
    const match = (t: Task, featureTitle?: string) => {
      if (filterAssigneeId && t.assignee_id !== filterAssigneeId) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (q) {
        const inLeaf = t.title.toLowerCase().includes(q);
        const inFeature = featureTitle
          ? featureTitle.toLowerCase().includes(q)
          : false;
        if (!inLeaf && !inFeature) return false;
      }
      return true;
    };
    const tree = buildTaskTree(tasks);
    const out: Row[] = [];
    const standalone: Task[] = [];
    for (const node of tree) {
      if (node.children.length > 0) {
        const kids = node.children.filter((c) => match(c, node.task.title));
        if (kids.length > 0) {
          out.push({ kind: "feature", label: node.task.title });
          for (const c of kids)
            out.push({ kind: "leaf", task: c, label: c.title });
        }
      } else if (match(node.task)) {
        standalone.push(node.task);
      }
    }
    if (standalone.length > 0) {
      out.push({ kind: "feature", label: "（親なし）" });
      for (const t of standalone)
        out.push({ kind: "leaf", task: t, label: t.title });
    }
    return out;
  }, [tasks, search, filterAssigneeId, filterStatus]);

  // Date window: min start / max due across dated tasks + milestones + base
  // date, padded by 3 days and capped at 180 days.
  const scale = useMemo(() => {
    const ds: number[] = [toMs(baseDate)];
    for (const r of rows) {
      if (r.kind !== "leaf") continue;
      if (r.task.start_date) ds.push(toMs(r.task.start_date));
      if (r.task.due_date) ds.push(toMs(r.task.due_date));
    }
    for (const m of milestones) if (m.due_date) ds.push(toMs(m.due_date));
    let min = Math.min(...ds) - 3 * DAYMS;
    let max = Math.max(...ds) + 3 * DAYMS;
    // Always show a comfortable window around the base date (2 weeks before,
    // 6 weeks after) so there's context and the timeline scrolls horizontally.
    const base = toMs(baseDate);
    min = Math.min(min, base - 14 * DAYMS);
    max = Math.max(max, base + 42 * DAYMS);
    let days = Math.round((max - min) / DAYMS) + 1;
    if (days > 365) {
      days = 365;
      max = min + (days - 1) * DAYMS;
    }
    return { min, days };
  }, [rows, milestones, baseDate]);

  const dayIdx = (d: string) => Math.round((toMs(d) - scale.min) / DAYMS);
  const TW = scale.days * DW;
  const todayX = dayIdx(baseDate) * DW;
  const headH = MH + DH;

  // 稲妻線（進捗線・実績ベース）：各リーフの実績到達位置を上から順に結ぶ折れ線。基準日
  // ラインより左＝遅れ／右＝先行。完了＝実績完了日(completed_at)／進行中＝今日／未着手＝
  // 予定基準（開始日がまだ先なら基準日上＝遅れ扱いしない、過ぎていれば予定開始位置＝遅れ）。
  let lightning: { line: string; dots: [number, number][] } | null = null;
  if (showLightning) {
    const dots: [number, number][] = [];
    let ly = 0;
    for (const r of rows) {
      if (r.kind === "feature") {
        ly += FH;
        continue;
      }
      const t = r.task;
      const yc = ly + LH / 2;
      ly += LH;
      if (!t.start_date || !t.due_date) continue;
      const sX = dayIdx(t.start_date) * DW;
      const eX = (dayIdx(t.due_date) + 1) * DW;
      let x: number;
      if (t.status === "done")
        x = t.completed_at ? dayIdx(t.completed_at) * DW : eX; // 実績完了日
      else if (t.status === "in_progress")
        x = todayX; // 進行中＝今日（着手済み・未完了）
      else if (toMs(t.start_date) > toMs(baseDate))
        x = todayX; // 未着手・予定がまだ先＝基準日上（遅れ扱いしない）
      else x = sX; // 未着手・予定開始を過ぎている＝予定開始位置（遅れ）
      dots.push([x, yc]);
    }
    if (dots.length > 0) {
      const totalH = rowsHeight(rows);
      const pts: [number, number][] = [[todayX, 0], ...dots, [todayX, totalH]];
      lightning = {
        line: pts.map(([x, yy]) => `${x},${yy}`).join(" "),
        dots,
      };
    }
  }

  // Day columns (weekend shade + right border + day number) and month spans.
  const dayCells: React.ReactNode[] = [];
  const monthSpans: { label: string; x: number; w: number }[] = [];
  let mStart = 0;
  let mCur = "";
  for (let i = 0; i < scale.days; i++) {
    const dt = new Date(scale.min + i * DAYMS);
    const wd = dt.getUTCDay();
    const we = wd === 0 || wd === 6;
    dayCells.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: i * DW,
          top: 0,
          width: DW,
          height: DH + rowsHeight(rows),
          borderRight: `1px solid ${GL}`,
          background: we ? WE : undefined,
        }}
      >
        <div
          style={{
            height: DH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            color: we ? "#a8a89f" : "#7d838a",
          }}
        >
          {dt.getUTCDate()}
        </div>
      </div>,
    );
    const mk = `${dt.getUTCFullYear()}/${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
    if (mCur === "") {
      mCur = mk;
      mStart = 0;
    }
    if (mk !== mCur) {
      monthSpans.push({ label: mCur, x: mStart * DW, w: (i - mStart) * DW });
      mCur = mk;
      mStart = i;
    }
  }
  monthSpans.push({
    label: mCur,
    x: mStart * DW,
    w: (scale.days - mStart) * DW,
  });

  return (
    <div className="relative flex-1">
      <ForestBackground />
      {/* ガントだけ他のタブ（max-w-4xl）より広い。横に日付が伸びる画面で、
          作業名と日付を同時に見たいという要望のため。画面いっぱいにはせず
          左右に余白を残す。 */}
      <main className="mx-auto w-full max-w-[1400px] px-4 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-zinc-900">ガントチャート</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-zinc-700">
              基準日
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value || todayIso())}
                className="rounded-lg border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500"
              />
            </label>
            <Link
              href="/tasks"
              className="text-sm hover:underline"
              style={{ color: "#3B6D11" }}
            >
              ← 進捗管理に戻る
            </Link>
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-zinc-600">
          <Legend c="#7cae4c" label="進行中/予定" />
          <Legend c="#e07a78" label="期限超過" />
          <Legend c="#b8b6ad" label="完了" />
          <span>
            <FlagIcon color="#BA7517" /> マイルストーン
          </span>
          <span style={{ color: "#2f6fdb" }}>┊ 基準日</span>
          <span style={{ color: "#e8590c" }}>／＼ 稲妻線（実績進捗）</span>
          <label
            style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={showLightning}
              onChange={(e) => setShowLightning(e.target.checked)}
            />
            稲妻線を表示
          </label>
        </div>

        {/* Search / assignee / status filters (mirror the tasks list) */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="タスク名で検索"
            className="min-w-[140px] flex-1 rounded-lg border border-zinc-300 bg-white/90 px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
          />
          <select
            value={filterAssigneeId}
            onChange={(e) => setFilterAssigneeId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white/90 px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-500"
          >
            <option value="">担当者：すべて</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {memberLabel(m)}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "" | TaskStatus)}
            className="rounded-lg border border-zinc-300 bg-white/90 px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-500"
          >
            <option value="">状態：すべて</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {!loaded ? (
          <p className="text-sm text-zinc-400">読み込み中…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-500">表示できるタスクがありません。</p>
        ) : (
          <div
            className="gantt-scroll rounded-lg bg-white"
            style={{
              overflow: "auto",
              maxHeight: "70vh",
              border: `1px solid ${GH}`,
            }}
          >
            <div style={{ display: "flex", minWidth: LABEL + TW }}>
              {/* Left 4-column table — pinned during horizontal scroll */}
              <div
                style={{
                  width: LABEL,
                  flexShrink: 0,
                  borderRight: `1px solid ${GH}`,
                  position: "sticky",
                  left: 0,
                  zIndex: 5,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    height: headH,
                    display: "flex",
                    borderBottom: `1px solid ${GH}`,
                    background: "#eef1ea",
                  }}
                >
                  {[
                    ["作業名", NAMEW],
                    ["担当者", WHOW],
                    ["開始日", SW],
                    ["終了日", EW],
                  ].map(([t, w]) => (
                    <div
                      key={t as string}
                      style={{
                        width: w as number,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "#5f6672",
                        borderRight: `1px solid ${GH}`,
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
                {rows.map((r, i) =>
                  r.kind === "feature" ? (
                    <div
                      key={i}
                      style={{
                        height: FH,
                        display: "flex",
                        borderBottom: `1px solid ${GL}`,
                        background: "#eef4e6",
                      }}
                    >
                      <div
                        style={{
                          width: NAMEW,
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: 8,
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#1f2937",
                          borderRight: `1px solid ${GH}`,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          // 入りきらない分は「…」で切る。切っただけだと途中で
                          // 消えたのか元から短いのか分からないため。全文は title で読める。
                          textOverflow: "ellipsis",
                        }}
                        title={r.label}
                      >
                        {r.label}
                      </div>
                      {[WHOW, SW, EW].map((w, k) => (
                        <div
                          key={k}
                          style={{ width: w, borderRight: `1px solid ${GH}` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      key={i}
                      style={{
                        height: LH,
                        display: "flex",
                        borderBottom: `1px solid ${GL}`,
                      }}
                    >
                      <div
                        style={{
                          width: NAMEW,
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: 8,
                          fontSize: 12,
                          color: "#374151",
                          borderRight: `1px solid ${GH}`,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                        title={r.label}
                      >
                        ＋{r.label}
                      </div>
                      <LeftCell w={WHOW}>
                        {resolveAssigneeLabel(r.task, labelById) ? (
                          <span style={{ color: "#4b5563" }}>
                            {resolveAssigneeLabel(r.task, labelById)}
                          </span>
                        ) : (
                          <span style={{ color: "#c4933a" }}>なし</span>
                        )}
                      </LeftCell>
                      <LeftCell w={SW} center>
                        {md(r.task.start_date)}
                      </LeftCell>
                      <LeftCell w={EW} center>
                        {md(r.task.due_date)}
                      </LeftCell>
                    </div>
                  ),
                )}
              </div>

              {/* Timeline */}
              <div style={{ position: "relative", width: TW }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: MH,
                    width: TW,
                    height: DH + rowsHeight(rows),
                  }}
                >
                  {dayCells}
                </div>

                {/* Month header */}
                <div
                  style={{
                    position: "relative",
                    height: MH,
                    borderBottom: `1px solid ${GH}`,
                  }}
                >
                  {monthSpans.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: m.x,
                        top: 0,
                        width: m.w,
                        height: MH,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "#5f6672",
                        borderRight: `1px solid ${GH}`,
                      }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>

                {/* Day-number row space (numbers drawn by the columns layer) + milestone flags */}
                <div
                  style={{
                    position: "relative",
                    height: DH,
                    borderBottom: `1px solid ${GH}`,
                  }}
                >
                  {milestones
                    .filter((m) => {
                      const x = dayIdx(m.due_date);
                      return x >= 0 && x < scale.days;
                    })
                    .map((m) => (
                      <div
                        key={m.id}
                        title={`${MILESTONE_KIND_META[m.kind].label}：${m.title}（${md(m.due_date)}）`}
                        style={{
                          position: "absolute",
                          left: dayIdx(m.due_date) * DW + 2,
                          top: 2,
                          zIndex: 3,
                        }}
                      >
                        <FlagIcon
                          size={14}
                          color={
                            m.kind === "deadline"
                              ? "#BA7517"
                              : m.kind === "review"
                                ? "#3f59a8"
                                : "#27500A"
                          }
                        />
                      </div>
                    ))}
                </div>

                {/* Milestone vertical guide lines (behind the bars) */}
                {milestones
                  .filter((m) => {
                    const x = dayIdx(m.due_date);
                    return x >= 0 && x < scale.days;
                  })
                  .map((m) => (
                    <div
                      key={`ml-${m.id}`}
                      style={{
                        position: "absolute",
                        left: dayIdx(m.due_date) * DW + 1,
                        top: MH + DH,
                        width: 0,
                        height: rowsHeight(rows),
                        borderLeft: `2px dotted ${
                          m.kind === "deadline"
                            ? "#BA7517"
                            : m.kind === "review"
                              ? "#3f59a8"
                              : "#27500A"
                        }`,
                        opacity: 0.35,
                        zIndex: 1,
                      }}
                    />
                  ))}

                {/* Rows with bars */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {rows.map((r, i) =>
                    r.kind === "feature" ? (
                      <div
                        key={i}
                        style={{
                          height: FH,
                          borderBottom: `1px solid ${GL}`,
                          background: "#f4f7ee",
                        }}
                      />
                    ) : (
                      <div
                        key={i}
                        style={{
                          height: LH,
                          position: "relative",
                          borderBottom: `1px solid ${GL}`,
                        }}
                      >
                        {r.task.start_date && r.task.due_date ? (
                          <div
                            title={`${r.label}（${md(r.task.start_date)}〜${md(r.task.due_date)}）`}
                            style={{
                              position: "absolute",
                              left: dayIdx(r.task.start_date) * DW,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width:
                                (dayIdx(r.task.due_date) -
                                  dayIdx(r.task.start_date) +
                                  1) *
                                DW,
                              height: 14,
                              borderRadius: 4,
                              background: barColor(r.task, baseDate),
                              boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.1)",
                            }}
                          />
                        ) : null}
                      </div>
                    ),
                  )}
                </div>

                {/* 稲妻線（進捗線）：棒の上に重ねる折れ線＋各リーフの到達点 */}
                {lightning && (
                  <svg
                    style={{
                      position: "absolute",
                      left: 0,
                      top: MH + DH,
                      width: TW,
                      height: rowsHeight(rows),
                      pointerEvents: "none",
                      overflow: "visible",
                      zIndex: 4,
                    }}
                  >
                    <polyline
                      points={lightning.line}
                      fill="none"
                      stroke="#e8590c"
                      strokeWidth={2}
                      strokeLinejoin="round"
                    />
                    {lightning.dots.map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r={3} fill="#e8590c" />
                    ))}
                  </svg>
                )}

                {/* Base-date vertical line */}
                <div
                  style={{
                    position: "absolute",
                    left: todayX,
                    top: MH,
                    width: 2,
                    height: DH + rowsHeight(rows),
                    background: "#2f6fdb",
                    opacity: 0.75,
                    zIndex: 2,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-zinc-400">
          ※ 棒＝開始日〜期限（進捗管理で登録した値と連動）。日付・担当の変更は進捗管理から。稲妻線＝各作業の実績到達位置（完了＝実績完了日／進行中＝今日／未着手＝予定基準。基準日より左＝遅れ／右＝先行）。依存の矢印は今後追加予定。
        </p>
      </main>

      <style>{`
        .gantt-scroll {
          scrollbar-width: thin;
          scrollbar-color: #c9c9c1 transparent;
        }
        .gantt-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .gantt-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .gantt-scroll::-webkit-scrollbar-thumb {
          background: #cdcdc5;
          border-radius: 6px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .gantt-scroll::-webkit-scrollbar-thumb:hover {
          background: #b6b6ad;
          background-clip: content-box;
        }
      `}</style>
    </div>
  );
}

function rowsHeight(rows: Row[]): number {
  return rows.reduce((h, r) => h + (r.kind === "feature" ? FH : LH), 0);
}

// Inline flag icon (the app doesn't load the Tabler icon font, so `ti-*`
// classes render blank — we use inline SVG like the header buttons do).
function FlagIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: -2 }}
    >
      <path d="M6 3a1 1 0 0 1 1 1v1h11l-2 3 2 3H7v9a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function Legend({ c, label }: { c: string; label: string }) {
  return (
    <span>
      <i
        style={{
          display: "inline-block",
          width: 10,
          height: 10,
          borderRadius: 2,
          background: c,
          verticalAlign: -1,
        }}
      />{" "}
      {label}
    </span>
  );
}

function LeftCell({
  w,
  center,
  children,
}: {
  w: number;
  center?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: w,
        display: "flex",
        alignItems: "center",
        justifyContent: center ? "center" : "flex-start",
        padding: "0 6px",
        fontSize: 11,
        color: "#4b5563",
        borderRight: `1px solid ${GH}`,
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}
