"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionMarker } from "@/components/section-marker";
import { contactSchema, type ContactPayload } from "@/lib/validations";
import { track } from "@/components/posthog-provider";

export function Contact() {
  const t = useTranslations("contact");
  const locale = useLocale() as ContactPayload["locale"];
  const reduce = useReducedMotion();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [hasFocus, setHasFocus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactPayload>({
    resolver: zodResolver(contactSchema),
    defaultValues: { locale },
  });

  async function onSubmit(values: ContactPayload) {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmittedName(values.name);
      setSent(true);
      track("contact_submitted", { locale });
    } catch {
      setErrorMsg(t("error"));
      track("contact_failed", { locale });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      className="relative scroll-mt-20 border-t border-border py-14 sm:py-20"
    >
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionMarker
            number="05"
            label={t("kicker")}
            title={t("title")}
            subtitle={t("subtitle")}
            className="mb-0"
          />

          <div className="flex flex-col gap-6">
            <div className="relative rounded-xl border border-border bg-surface p-6 sm:p-8 transition-colors">
              {/* Left lime indicator while form is in focus */}
              <span
                className={`pointer-events-none absolute left-0 top-6 bottom-6 w-0.5 rounded-full transition-all duration-300 ${
                  hasFocus ? "bg-lime opacity-100" : "bg-lime opacity-0"
                }`}
                aria-hidden
              />

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduce ? 0 : 0.3 }}
                  className="flex flex-col items-start gap-4 py-6"
                >
                  <Badge variant="lime" className="font-mono">
                    <Check className="mr-1 h-3 w-3" /> {t("confirmedBadge")}
                  </Badge>
                  <p className="text-base text-foreground">
                    {submittedName ? t("successWithName", { name: submittedName }) : t("success")}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("success")}</p>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  onFocusCapture={() => setHasFocus(true)}
                  onBlurCapture={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setHasFocus(false);
                  }}
                  noValidate
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">{t("name")}</Label>
                    <Input
                      id="contact-name"
                      autoComplete="given-name"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">{t("email")}</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">{t("message")}</Label>
                    <Textarea
                      id="contact-message"
                      rows={5}
                      aria-invalid={!!errors.message}
                      {...register("message")}
                    />
                  </div>
                  <input type="hidden" {...register("locale")} value={locale} />
                  {errorMsg && (
                    <p className="text-sm text-destructive" role="alert">
                      {errorMsg}
                    </p>
                  )}
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? t("submitting") : t("submit")}
                    {!submitting && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
