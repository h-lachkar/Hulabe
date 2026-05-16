"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, AlertCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { markPasswordSet } from "@/lib/auth/password-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupPasswordForm({
  successRedirect,
}: {
  successRedirect: string;
}) {
  const router = useRouter();
  const t = useTranslations("auth.setupForm");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("errors.tooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("errors.mismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Flip passwordSetAt on User if applicable (no-op for clients)
      await markPasswordSet().catch(() => {});

      router.push(successRedirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.default"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">{t("passwordLabel")}</Label>
        <Input
          id="new-password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">{t("confirmLabel")}</Label>
        <Input
          id="confirm-password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t("confirmPlaceholder")}
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
        disabled={submitting || !password || !confirm}
      >
        {submitting ? t("submitting") : t("submit")}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
