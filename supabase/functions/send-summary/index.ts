// Supabase Edge Function: send-summary
//
// Y1 (this version): when invoked, build the current progress summary and send
// it by email to the configured recipients. Trigger it manually to verify SMTP
// works from Supabase. The schedule check + cron come in Y2.
//
// Required secrets (Edge Function): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_FROM,
// SMTP_PASSWORD. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by
// Supabase automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

type TaskStatus = "todo" | "in_progress" | "done";
type Task = { status: TaskStatus };

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};
const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildSummary(tasks: Task[], dateLabel: string) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const counts = STATUS_ORDER.map((s) => ({
    label: STATUS_LABELS[s],
    n: tasks.filter((t) => t.status === s).length,
  }));

  const subject = `進捗サマリ (${dateLabel})`;
  const text = [
    `進捗サマリ (${dateLabel})`,
    "",
    `チーム全体の進捗: ${done} / ${total} 完了 (${percent}%)`,
    counts.map((c) => `${c.label}: ${c.n} 件`).join(" / "),
  ].join("\n");
  const html = `
    <div style="font-family: system-ui, sans-serif; color: #1f2937;">
      <h2 style="margin:0 0 12px;">進捗サマリ (${dateLabel})</h2>
      <p style="margin:0 0 8px;">チーム全体の進捗: <strong>${done} / ${total}</strong> 完了 (${percent}%)</p>
      <ul style="margin:0; padding-left:20px;">
        ${counts.map((c) => `<li>${c.label}: <strong>${c.n}</strong> 件</li>`).join("")}
      </ul>
    </div>`.trim();

  return { subject, text, html };
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Recipients from the saved settings.
  const { data: settings } = await supabase
    .from("email_settings")
    .select("recipients")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const recipients = (settings?.recipients ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) {
    return json({ error: "送信先が設定されていません。" }, 400);
  }

  // Tasks -> summary.
  const { data: tasks, error: tasksErr } = await supabase
    .from("tasks")
    .select("status")
    .order("created_at", { ascending: true });
  if (tasksErr) return json({ error: "タスクの取得に失敗しました。" }, 500);

  const now = new Date();
  const dateLabel = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  const summary = buildSummary((tasks ?? []) as Task[], dateLabel);

  // Send via SMTP.
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST")!,
      port,
      tls: port === 465, // 465 implicit TLS; 587 upgrades via STARTTLS
      auth: {
        username: Deno.env.get("SMTP_USER")!,
        password: Deno.env.get("SMTP_PASSWORD")!,
      },
    },
  });

  try {
    await client.send({
      from: Deno.env.get("SMTP_FROM")!,
      to: recipients,
      subject: summary.subject,
      content: summary.text,
      html: summary.html,
    });
    await client.close();
  } catch (err) {
    console.error(err);
    return json({ error: "メール送信に失敗しました。", detail: String(err) }, 500);
  }

  return json({ ok: true, sentTo: recipients });
});
