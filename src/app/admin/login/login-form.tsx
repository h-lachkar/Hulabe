"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "Cet email n'est pas dans la liste des admins.",
  invalid_link: "Lien expiré ou invalide. Demande un nouveau magic link.",
};

export function LoginForm({
  errorParam,
  sent: initialSent,
}: {
  errorParam?: string;
  sent: boolean;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(initialSent);
  const [error, setError] = useState<string | null>(
    errorParam ? ERROR_MESSAGES[errorParam] ?? "Erreur d'authentification." : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'envoi du magic link.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-lime/30 bg-lime/5 p-6 text-sm">
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-lime">
          <Check className="h-3.5 w-3.5" /> SENT
        </div>
        <p className="text-foreground">
          Magic link envoyé à <strong>{email || "ton email"}</strong>.
        </p>
        <p className="mt-2 text-muted-foreground">
          Clique le lien dans le mail pour te connecter. Tu peux fermer cet onglet.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email admin</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hugo@hulabe.com"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={submitting || !email}>
        {submitting ? "Envoi…" : "Envoyer le magic link"}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
