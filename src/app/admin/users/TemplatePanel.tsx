"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_TEMPLATES,
  loadTaskTemplates,
  type TaskTemplate,
} from "@/lib/taskTemplates";
import { DEFAULT_PRIORITY_META } from "@/lib/priorities";
import { DEFAULT_TASK_TYPE_META } from "@/lib/taskTypes";
import { C, CARD_STYLE } from "./theme";

/**
 * 定型タスクマスタ — read-only for now.
 *
 * Editing a template means adding, removing and reordering its children, which
 * is a different kind of screen from renaming a label. The built-in templates
 * already work (see TemplateSidebar), so showing what they contain is the
 * useful half; the editor comes once task_templates exists to save into.
 */
export default function TemplatePanel() {
  const [templates, setTemplates] = useState<TaskTemplate[]>(DEFAULT_TEMPLATES);
  const [fromDb, setFromDb] = useState(false);

  useEffect(() => {
    loadTaskTemplates()
      .then((t) => {
        setTemplates(t);
        setFromDb(t !== DEFAULT_TEMPLATES);
      })
      .catch(() => setTemplates(DEFAULT_TEMPLATES));
  }, []);

  return (
    <section className="px-5 py-4" style={CARD_STYLE}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[1.05rem] font-extrabold">📋 定型タスクマスタ</h2>
        <span className="text-[0.82rem]" style={{ color: C.muted }}>
          {templates.length}件
        </span>
      </div>
      <p className="mb-3.5 mt-1.5 text-[0.86rem]" style={{ color: C.muted }}>
        毎回同じ手順で登録している作業の雛形です。
        <b style={{ color: C.ink }}>生成ボタンは進捗管理（/tasks）の左側にあり、メンバー全員が押せます</b>
        ── 雛形を決めるのは管理者、使うのは全員、という切り分けです。
      </p>

      {!fromDb && (
        <p
          className="mb-3 rounded-lg px-3 py-2 text-[0.84rem]"
          style={{ background: C.warnBg, color: C.ink }}
        >
          <b style={{ color: C.warn }}>いまはコード内の既定テンプレートを表示しています。</b>
          編集できるようにするには{" "}
          <span className="font-mono">scripts/sql/task_templates.sql</span> を
          Supabase で実行してください。実行前でも<b style={{ color: C.ink }}>生成は使えます</b>。
        </p>
      )}

      <div className="flex flex-col gap-3">
        {templates.map((t) => (
          <div
            key={t.code}
            className="rounded-xl px-3.5 py-3"
            style={{ background: C.card2, border: `1px solid ${C.line}` }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[0.95rem] font-extrabold">{t.name}</p>
              <span className="text-[0.78rem]" style={{ color: C.muted }}>
                親1 ＋ 子{t.items.length}・優先度{" "}
                {DEFAULT_PRIORITY_META[t.priority].label}
              </span>
            </div>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {t.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-1.5 text-[0.82rem]"
                  style={{ color: C.muted }}
                >
                  <span style={{ color: C.line }}>└</span>
                  <span style={{ color: C.ink }}>{item.title}</span>
                  {item.taskType && (
                    <span
                      className="rounded px-1.5 text-[0.7rem]"
                      style={{ background: C.card, border: `1px solid ${C.line}` }}
                    >
                      {DEFAULT_TASK_TYPE_META[item.taskType].label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p
        className="mt-3.5 rounded-xl px-3 py-2.5 text-[0.82rem]"
        style={{
          background: C.card2,
          border: `1px dashed ${C.line}`,
          color: C.muted,
        }}
      >
        <b style={{ color: C.ink }}>編集はまだできません。</b>
        雛形の編集は、子タスクの追加・削除・並べ替えを伴うので、
        表示名を直すだけの他のマスタとは別の画面になります。
        テーブルを作ったうえで次に着手します。
      </p>
      <p
        className="mt-2 rounded-xl px-3 py-2.5 text-[0.82rem]"
        style={{
          background: C.card2,
          border: `1px dashed ${C.line}`,
          color: C.muted,
        }}
      >
        <b style={{ color: C.ink }}>見積時間は雛形に持たせていません。</b>
        適当な見積を入れると、そのまま
        <b style={{ color: C.ink }}>工数効率（見積 ÷ 実績）</b>
        に流れ込んで数字を歪めるためです。担当者・期限も空のまま作られます。
      </p>
    </section>
  );
}
