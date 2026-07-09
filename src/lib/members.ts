import { supabase } from "./supabase";

// A registered user, read from the profiles table (which is populated on
// signup via a DB trigger, and backfilled for existing users).
export type Member = {
  id: string;
  name: string | null;
  email: string | null;
};

// The label shown in the picker and stored in task.assignee. We keep storing
// the display label (name, else email) rather than the user id so it stays
// compatible with the existing name-based assignee column and the summaries.
export function memberLabel(m: Member): string {
  return (m.name && m.name.trim()) || m.email || "名前未設定";
}

/** All registered members, sorted by name. */
export async function listMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}
