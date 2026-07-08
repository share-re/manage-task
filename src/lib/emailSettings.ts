import { supabase } from "./supabase";

export type MailFrequency = "daily" | "weekly";

export type EmailSettings = {
  id: string;
  recipients: string; // comma-separated addresses
  frequency: MailFrequency;
  day_of_week: number | null; // 0=Sun .. 6=Sat, used when weekly
  send_time: string; // "HH:MM" or "HH:MM:SS"
  enabled: boolean;
  updated_by: string | null;
  updated_at: string;
};

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

/** Get the (single, team-wide) email settings row, or null if none saved yet. */
export async function getEmailSettings(): Promise<EmailSettings | null> {
  const { data, error } = await supabase
    .from("email_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as EmailSettings) ?? null;
}

export type EmailSettingsInput = {
  recipients: string;
  frequency: MailFrequency;
  dayOfWeek: number | null;
  sendTime: string;
  enabled: boolean;
};

/** Insert or update the team-wide email settings. Pass id to update an existing row. */
export async function saveEmailSettings(
  input: EmailSettingsInput,
  id?: string,
): Promise<EmailSettings> {
  const payload = {
    recipients: input.recipients,
    frequency: input.frequency,
    day_of_week: input.frequency === "weekly" ? input.dayOfWeek : null,
    send_time: input.sendTime,
    enabled: input.enabled,
  };

  if (id) {
    const { data, error } = await supabase
      .from("email_settings")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as EmailSettings;
  }

  const { data, error } = await supabase
    .from("email_settings")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as EmailSettings;
}
