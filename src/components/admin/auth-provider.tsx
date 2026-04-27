"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: "rider" | "driver" | "admin";
  avatar_url: string | null;
};

type AuthState = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  sendOtp: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const syncRequestRef = useRef(0);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, avatar_url")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("fetchProfile error:", error.message);
      return null;
    }
    return data as Profile | null;
  }, []);

  const syncAuthState = useCallback(async (nextSession: Session | null) => {
    const requestId = ++syncRequestRef.current;
    const nextUser = nextSession?.user ?? null;

    setLoading(true);
    setSession(nextSession);
    setUser(nextUser);

    if (!nextUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const nextProfile = await fetchProfile(nextUser.id);
    if (requestId !== syncRequestRef.current) {
      return;
    }

    setProfile(nextProfile);
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!active) {
        return;
      }
      void syncAuthState(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) {
        return;
      }
      void syncAuthState(s);
    });

    return () => {
      active = false;
      syncRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, [syncAuthState]);

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin: profile?.role === "admin",
        sendOtp,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
