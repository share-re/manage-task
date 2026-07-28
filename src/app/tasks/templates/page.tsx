import { redirect } from "next/navigation";

/**
 * 定型タスク used to be its own screen. It now opens as a panel over the task
 * list instead — coming back to the same scroll position beats having a URL —
 * so this route just forwards, rather than leaving a stale bookmark broken.
 */
export default function TaskTemplatesPage() {
  redirect("/tasks");
}
