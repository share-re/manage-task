import { supabase } from "./supabase";

// A comment attached to a task. Team-shared like tasks (RLS: any authenticated
// user can read/write). Requires a "task_comments" table in the DB.
export type TaskComment = {
  id: string;
  task_id: string;
  author: string | null;
  body: string;
  created_at: string;
};

const COMMENT_COLUMNS = "id, task_id, author, body, created_at";

/** Fetch all comments, oldest first. Grouped by task_id on the client. */
export async function listComments(): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from("task_comments")
    .select(COMMENT_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TaskComment[];
}

/** Add a comment to a task. */
export async function addComment(input: {
  taskId: string;
  body: string;
  author: string | null;
}): Promise<TaskComment> {
  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: input.taskId,
      body: input.body,
      author: input.author,
    })
    .select(COMMENT_COLUMNS)
    .single();
  if (error) throw error;
  return data as TaskComment;
}
