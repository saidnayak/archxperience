import { create } from "zustand";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { setRepositoryMode } from "../lib/repository";
import { useProjectStore } from "./useProjectStore";
import { useEditorStore } from "./useEditorStore";

export type AuthMode = "cloud" | "guest";

interface AuthState {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  mode: AuthMode;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setGuestMode: () => void;
  clearError: () => void;
}

const AUTH_MODE_KEY = "archxperience:v1:auth_mode";

// Helper to format human-readable auth error messages
function sanitizeAuthError(err: unknown): string {
  if (!err) return "An unexpected error occurred.";
  const msg = (err as AuthError)?.message || String(err);
  if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
    return "Invalid email or password. Please verify your credentials.";
  }
  if (msg.includes("Email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox.";
  }
  if (msg.includes("User already registered") || msg.includes("user_already_exists")) {
    return "An account with this email address already exists. Please sign in.";
  }
  if (msg.includes("Password should be at least")) {
    return "Password must be at least 6 characters long.";
  }
  if (msg.includes("Network request failed") || msg.includes("Failed to fetch")) {
    return "Network connection issue. Please check your internet connection.";
  }
  return msg;
}


let authSubscriptionInitialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  initialized: false,
  loading: false,
  error: null,
  mode: (localStorage.getItem(AUTH_MODE_KEY) as AuthMode) || "guest",

  initialize: async () => {
    if (get().initialized) return;

    if (!isSupabaseConfigured || !supabase) {
      set({
        initialized: true,
        loading: false,
        mode: "guest",
        user: null,
        session: null,
      });
      return;
    }

    try {
      // 1. Fetch current session on bootstrap
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (data.session) {
        localStorage.setItem(AUTH_MODE_KEY, "cloud");
        setRepositoryMode("cloud");
        set({
          user: data.session.user,
          session: data.session,
          mode: "cloud",
          initialized: true,
          loading: false,
          error: null,
        });
      } else {
        const savedMode = (localStorage.getItem(AUTH_MODE_KEY) as AuthMode) || "guest";
        setRepositoryMode(savedMode === "cloud" ? "cloud" : "local");
        set({
          user: null,
          session: null,
          mode: savedMode,
          initialized: true,
          loading: false,
        });
      }

      // 2. Set up single global onAuthStateChange listener
      if (!authSubscriptionInitialized) {
        authSubscriptionInitialized = true;
        supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            const currentUserId = get().user?.id;
            if (currentUserId && currentUserId !== session.user.id) {
              useProjectStore.getState().clearProjects();
              useEditorStore.getState().resetProject();
            }
            localStorage.setItem(AUTH_MODE_KEY, "cloud");
            setRepositoryMode("cloud");
            set({
              user: session.user,
              session,
              mode: "cloud",
              error: null,
            });
          } else if (event === "SIGNED_OUT") {
            localStorage.setItem(AUTH_MODE_KEY, "guest");
            setRepositoryMode("local");
            useProjectStore.getState().clearProjects();
            useEditorStore.getState().resetProject();
            set({
              user: null,
              session: null,
              mode: "guest",
            });
          }
        });
      }
    } catch (err) {
      console.warn("[AuthStore] Failed to initialize session:", err);
      setRepositoryMode("local");
      set({
        initialized: true,
        loading: false,
        mode: "guest",
      });
    }
  },

  signUp: async (email, password, fullName) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Please continue as Guest.");
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || "",
          },
        },
      });

      if (error) throw error;

      const needsConfirmation = !data.session && !!data.user;
      if (data.session) {
        localStorage.setItem(AUTH_MODE_KEY, "cloud");
        setRepositoryMode("cloud");
        useProjectStore.getState().clearProjects();
        useEditorStore.getState().resetProject();
        set({
          user: data.session.user,
          session: data.session,
          mode: "cloud",
          loading: false,
          error: null,
        });
      } else {
        set({ loading: false, error: null });
      }

      return { needsConfirmation };
    } catch (err) {
      const friendlyMessage = sanitizeAuthError(err);
      set({ error: friendlyMessage, loading: false });
      throw new Error(friendlyMessage);
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Please continue as Guest.");
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      localStorage.setItem(AUTH_MODE_KEY, "cloud");
      setRepositoryMode("cloud");
      useProjectStore.getState().clearProjects();
      useEditorStore.getState().resetProject();

      set({
        user: data.user,
        session: data.session,
        mode: "cloud",
        loading: false,
        error: null,
      });

      // Eagerly hydrate fresh cloud projects
      useProjectStore.getState().loadProjects().catch(() => {});
    } catch (err) {
      const friendlyMessage = sanitizeAuthError(err);
      set({ error: friendlyMessage, loading: false });
      throw new Error(friendlyMessage);
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      if (supabase && isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn("[AuthStore] SignOut warning:", err);
    } finally {
      localStorage.setItem(AUTH_MODE_KEY, "guest");
      setRepositoryMode("local");
      useProjectStore.getState().clearProjects();
      useEditorStore.getState().resetProject();
      set({
        user: null,
        session: null,
        mode: "guest",
        loading: false,
        error: null,
      });
      // Hydrate local repository projects
      useProjectStore.getState().loadProjects().catch(() => {});
    }
  },

  setGuestMode: () => {
    localStorage.setItem(AUTH_MODE_KEY, "guest");
    setRepositoryMode("local");
    useProjectStore.getState().clearProjects();
    useEditorStore.getState().resetProject();
    set({
      mode: "guest",
      error: null,
    });
    useProjectStore.getState().loadProjects().catch(() => {});
  },


  clearError: () => set({ error: null }),
}));
