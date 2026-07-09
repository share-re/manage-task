import { supabase } from "./supabase";

// A record of one summary-email send attempt. Written server-side (service
// role) by the send route; read here for the history view.
export type SendLog = {
  id: string;
  recipients: string | null;
  subject: string | null;
  status: "sent" | "failed";
  error: string | null;
  sent_at: string;
};

/** Recent send history, newest first. */
export async function listSendLog(limit = 10): Promise<SendLog[]> {
  const { data, error } = await supabase
    .from("email_send_log")
    .select("id, recipients, subject, status, error, sent_at")
    .order("sent_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SendLog[];
}
