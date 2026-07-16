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
  const [profileName, setProfileName] = useState<string | null>(null);

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

  const loadProfileName = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", uid)
      .single();
    setProfileName((data?.name as string | null) ?? null);
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setProfileName(null);
      return;
    }
    loadProfileName(uid);
  }, [session?.user?.id, loadProfileName]);

  const refreshProfileName = useCallback(() => {
    const uid = session?.user?.id;
    if (uid) loadProfileName(uid);
  }, [session?.user?.id, loadProfileName]);

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
