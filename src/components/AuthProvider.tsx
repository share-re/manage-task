"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  loading: boolean;
  // Current display name from profiles.name (source of truth). Null until
  // loaded or when unset; callers fall back to user_metadata.name / email.
  profileName: string | null;
  // Re-fetch profiles.name after the user edits their display name.
  refreshProfileName: () => void;
};

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  profileName: null,
  refreshProfileName: () => {},
});

/** Tracks the Supabase auth session and the user's profiles.name via useAuth(). */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Keep the fetched name together with the user it belongs to. Deriving the
  // exposed value from that pair means a re-login can't briefly show the
  // previous user's name, and we never have to clear state inside an effect.
  const [profile, setProfile] = useState<{
    uid: string;
    name: string | null;
  } | null>(null);

  const uid = session?.user?.id ?? null;
  const profileName = profile && profile.uid === uid ? profile.name : null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Bumped by refreshProfileName() to re-run the fetch below (e.g. right after
  // the user edits their display name).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    supabase
      .from("profiles")
      .select("name")
      .eq("id", uid)
      .single()
      .then(({ data }) => {
        // Ignore a response that arrived after the user changed.
        if (alive) {
          setProfile({ uid, name: (data?.name as string | null) ?? null });
        }
      });
    return () => {
      alive = false;
    };
  }, [uid, reloadKey]);

  const refreshProfileName = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, loading, profileName, refreshProfileName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
