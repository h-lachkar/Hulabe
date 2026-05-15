"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Client-side callback that handles ALL Supabase auth flows:
 *
 * 1) Implicit flow (legacy default for invite/recovery emails) — tokens in URL hash:
 *    /auth/callback#access_token=...&refresh_token=...&type=recovery
 *    The hash is NEVER sent to the server, so we MUST handle this client-side.
 *
 * 2) PKCE flow (modern) — `?code=...` query param.
 *
 * 3) OTP token flow — `?token_hash=&type=`.
 */
export function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createSupabaseBrowserClient();

      // --- Parse hash (implicit flow) ---
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const hashParams = new URLSearchParams(
        hash.startsWith("#") ? hash.substring(1) : hash,
      );
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      const hashError = hashParams.get("error_description") ?? hashParams.get("error");

      // --- Parse query (PKCE / OTP / errors) ---
      const code = searchParams.get("code");
      const token_hash =
        searchParams.get("token_hash") ?? searchParams.get("token");
      const otpType = searchParams.get("type") as
        | "signup"
        | "invite"
        | "magiclink"
        | "recovery"
        | "email_change"
        | "email"
        | null;
      const queryError =
        searchParams.get("error_description") ?? searchParams.get("error");
      const next = searchParams.get("next");

      if (hashError || queryError) {
        if (!cancelled) {
          setError(hashError ?? queryError ?? "Auth error");
          router.replace("/admin/login?error=invalid_link");
        }
        return;
      }

      try {
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (token_hash && otpType) {
          const { error } = await supabase.auth.verifyOtp({
            type: otpType,
            token_hash,
          });
          if (error) throw error;
        } else {
          throw new Error("No auth payload in URL");
        }

        if (cancelled) return;

        // Strip hash from URL — tokens shouldn't linger
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        }

        const target = next && next.startsWith("/") ? next : "/admin";
        router.replace(target);
        router.refresh();
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Auth error";
        setError(msg);
        const targetLogin = next?.startsWith("/client")
          ? "/client/login?error=invalid_link"
          : "/admin/login?error=invalid_link";
        router.replace(targetLogin);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime motion-safe:animate-pulse" />
          HULABE / AUTH
        </div>
        {error ? (
          <>
            <h1 className="display text-2xl">Lien invalide</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <p className="mt-4 text-xs text-muted-2">Redirection…</p>
          </>
        ) : (
          <>
            <h1 className="display text-2xl">Connexion en cours…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Validation de ton lien.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
