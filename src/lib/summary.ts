import { STATUS_LABELS, STATUS_ORDER, taskProgress, type Task } from "./tasks";

export type Summary = { subject: string; text: string; html: string };

/** Build a progress-summary email (subject + text + html) from the task list. */
export function buildProgressSummary(tasks: Task[], dateLabel: string): Summary {
  const { done, total, percent } = taskProgress(tasks);
  const counts = STATUS_ORDER.map((s) => ({
    label: STATUS_LABELS[s],
    n: tasks.filter((t) => t.status === s).length,
  }));

  const subject = `進捗サマリ (${dateLabel})`;

  const countLines = counts.map((c) => `${c.label}: ${c.n} 件`).join(" / ");
  const text = [
    `進捗サマリ (${dateLabel})`,
    "",
    `チーム全体の進捗: ${done} / ${total} 完了 (${percent}%)`,
    countLines,
  ].join("\n");

  const countHtml = counts
    .map((c) => `<li>${c.label}: <strong>${c.n}</strong> 件</li>`)
    .join("");
  const html = `
    <div style="font-family: system-ui, sans-serif; color: #1f2937;">
      <h2 style="margin:0 0 12px;">進捗サマリ (${dateLabel})</h2>
      <p style="margin:0 0 8px;">
        チーム全体の進捗: <strong>${done} / ${total}</strong> 完了 (${percent}%)
      </p>
      <ul style="margin:0; padding-left: 20px;">${countHtml}</ul>
    </div>
  `.trim();

  return { subject, text, html };
}
