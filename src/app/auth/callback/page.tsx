import { Suspense } from "react";
import { CallbackClient } from "./callback-client";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackClient />
    </Suspense>
  );
}

function CallbackFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime motion-safe:animate-pulse" />
          HULABE / AUTH
        </div>
        <h1 className="display text-2xl">Connexion en cours…</h1>
      </div>
    </div>
  );
}
