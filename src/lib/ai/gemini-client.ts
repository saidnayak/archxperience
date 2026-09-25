import { supabase, isSupabaseConfigured } from "../supabase";
import type { AIGenerationRequest, RawGeneratedProject } from "./types";

export interface AIClientError {
  code: "UNAUTHORIZED" | "UNCONFIGURED" | "RATE_LIMITED" | "TIMEOUT" | "AI_UNAVAILABLE" | "GENERATION_FAILED";
  message: string;
}

/**
 * Invokes the secure Supabase Edge Function to generate an architectural presentation.
 * All API secrets remain strictly protected within the server-side Edge Function.
 */
export async function invokeAIGenerationFunction(
  request: AIGenerationRequest
): Promise<RawGeneratedProject> {
  // 1. Verify Supabase Cloud connection is present
  if (!isSupabaseConfigured || !supabase) {
    throw {
      code: "UNCONFIGURED",
      message: "Cloud services are not configured. Please connect your Supabase project.",
    } as AIClientError;
  }

  // 2. Verify caller has an active authenticated session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session) {
    throw {
      code: "UNAUTHORIZED",
      message: "AI presentation generation requires an active ArchXperience Cloud workspace. Please sign in or create an account.",
    } as AIClientError;
  }

  // 3. Set up timeout controller (45-second threshold)
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);

  try {
    // 4. Invoke Edge Function with authenticated caller token
    const { data, error } = await supabase.functions.invoke("generate-presentation", {
      body: request,
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });

    clearTimeout(timeoutId);

    if (error) {
      console.error("[AI Client] Edge function invocation error:", error);
      let serverError: any = null;
      try {
        if ("context" in error && error.context) {
          const res = error.context as Response;
          if (typeof res.json === "function") {
            serverError = await res.json();
          }
        }
      } catch (parseErr) {
        console.warn("[AI Client] Could not parse server error context as JSON:", parseErr);
      }

      console.error("[AI Client] Server response details:", serverError);

      if (serverError?.error?.message) {
        throw {
          code: serverError.error.code || "GENERATION_FAILED",
          message: serverError.error.message,
        } as AIClientError;
      }

      // Handle specific HTTP or service codes
      if (error.status === 401 || error.status === 403) {
        throw {
          code: "UNAUTHORIZED",
          message: "Your cloud session has expired. Please sign in again to generate presentations.",
        } as AIClientError;
      }
      if (error.status === 429) {
        throw {
          code: "RATE_LIMITED",
          message: "Generation rate limit reached. Please wait a moment before trying again.",
        } as AIClientError;
      }
      if (error.status === 503) {
        throw {
          code: "AI_UNAVAILABLE",
          message: "AI generation service is temporarily unavailable. Please try again shortly.",
        } as AIClientError;
      }

      throw {
        code: "GENERATION_FAILED",
        message: error.message || "Failed to generate presentation. Please try again.",
      } as AIClientError;
    }

    if (!data) {
      throw {
        code: "GENERATION_FAILED",
        message: "No data returned from presentation generation engine.",
      } as AIClientError;
    }

    // Check if function returned an application-level error
    if (data.error) {
      throw {
        code: data.error.code || "GENERATION_FAILED",
        message: data.error.message || "Presentation generation failed. Please try again.",
      } as AIClientError;
    }

    return (data.data || data) as RawGeneratedProject;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if ((err as Error)?.name === "AbortError") {
      throw {
        code: "TIMEOUT",
        message: "Presentation generation took longer than expected. Please try with a slightly shorter prompt.",
      } as AIClientError;
    }

    // Propagate structured errors
    if ((err as AIClientError)?.code) {
      throw err;
    }

    console.error("[AI Client] Unexpected generation failure:", err);
    throw {
      code: "GENERATION_FAILED",
      message: "The presentation could not be generated. Your workspace has not been modified.",
    } as AIClientError;
  }
}
