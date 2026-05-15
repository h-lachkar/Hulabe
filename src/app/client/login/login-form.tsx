"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized:
    "Aucun projet trouvé pour cet email. Si tu penses que c'est une erreur, écris à support@hulabe.com.",
  invalid_link: "Lien expiré ou invalide. Demande un nouveau lien.",
};

export function ClientLoginForm({
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
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/client`,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'envoi du lien.");
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
          Lien envoyé à <strong>{email || "ton email"}</strong>.
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="toi@exemple.com"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={submitting || !email}>
        {submitting ? "Envoi…" : "Recevoir le lien"}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Pas de mot de passe. On t&apos;envoie un lien magique par email.
      </p>
    </form>
  );
}
