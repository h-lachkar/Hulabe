"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sendAdminSetupLink } from "@/lib/auth/password-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "recover";

export function LoginForm({
  errorMessage,
}: {
  errorMessage?: string | null;
  sent?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recoverPending, startRecover] = useTransition();
  const [error, setError] = useState<string | null>(errorMessage ?? null);
  const [recoverMessage, setRecoverMessage] = useState<string | null>(null);

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : err.message
          : "Erreur de connexion.",
      );
      setSubmitting(false);
    }
  }

  function onRecover(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRecoverMessage(null);
    startRecover(async () => {
      const fd = new FormData();
      fd.append("email", email);
      const res = await sendAdminSetupLink(fd);
      if (res.ok) {
        setRecoverMessage(
          res.message ?? "Lien envoyé. Vérifie ta boîte mail.",
        );
      } else {
        setError(res.error);
      }
    });
  }

  if (mode === "recover") {
    return (
      <form onSubmit={onRecover} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recover-email">Email admin</Label>
          <Input
            id="recover-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@hulabe.com"
            autoFocus
          />
        </div>

        {error && (
          <p className="inline-flex items-start gap-1.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        {recoverMessage && (
          <div className="rounded-xl border border-lime/30 bg-lime/5 p-4 text-sm">
            <p className="mb-1 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-lime">
              <Check className="h-3.5 w-3.5" /> Envoyé
            </p>
            <p className="text-foreground">{recoverMessage}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={recoverPending || !email}>
          {recoverPending ? "Envoi…" : "Recevoir le lien"}
          {!recoverPending && <ArrowRight className="h-4 w-4" />}
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
            setRecoverMessage(null);
          }}
          className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          ← Retour à la connexion par mot de passe
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@hulabe.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Mot de passe</Label>
        <Input
          id="signin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="inline-flex items-start gap-1.5 text-sm text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting || !email || !password}
      >
        {submitting ? "Connexion…" : "Se connecter"}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode("recover");
          setError(null);
        }}
        className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Première connexion ou mot de passe oublié&nbsp;?
      </button>
    </form>
  );
}
