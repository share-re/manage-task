import { supabase } from "./supabase";

// 発言者。"user"=利用者、"model"=AI内田さん。
export type ConversationRole = "user" | "model";

// 会話（1スレッド）1件分。DBの conversations テーブルに対応。
export type Conversation = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

// 保存された発言1件分。DBの messages テーブルに対応。
export type StoredMessage = {
  id: string;
  conversation_id: string;
  role: ConversationRole;
  text: string;
  created_at: string;
};

// 新しい会話を作る。title は最初のユーザー発言の先頭を使う想定（長すぎは切る）。
// user_id はDB側が auth.uid()（ログイン中の本人）で自動的に埋める（RLSで保護）。
export async function createConversation(title: string): Promise<Conversation> {
  const trimmed = title.trim().slice(0, 80);
  const { data, error } = await supabase
    .from("conversations")
    .insert({ title: trimmed || null })
    .select()
    .single();
  if (error) throw error;
  return data as Conversation;
}

// 発言を1件保存する。
export async function addMessage(
  conversationId: string,
  role: ConversationRole,
  text: string,
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, text });
  if (error) throw error;
}

// 会話の updated_at を今にする（一覧を「最近使った順」に並べるため）。
export async function touchConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw error;
}

// 過去の会話一覧を「最近使った順」で取得する（段階3で使う）。
export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

// ある会話の発言を「古い順」で取得する（段階3で使う）。
export async function getMessages(
  conversationId: string,
): Promise<StoredMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StoredMessage[];
}

// 会話を削除する。ぶら下がる messages は on delete cascade で一緒に消える（段階4で使う）。
export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);
  if (error) throw error;
}
