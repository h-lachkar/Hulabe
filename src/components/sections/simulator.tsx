"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionMarker } from "@/components/section-marker";
import { track } from "@/components/posthog-provider";
import { cn, formatPriceRange } from "@/lib/utils";
import { computeEstimate, SERVICE_PRICE_RANGES } from "@/lib/pricing";
import {
  SERVICE_FLOWS,
  isStepValid,
  type FlowAnswer,
  type FlowStep,
  type Locale,
} from "@/lib/simulator-flow";
import type { Budget, ServiceType, Timeline } from "@/types";

const SERVICE_OPTIONS: ServiceType[] = [
  "VITRINE",
  "ECOMMERCE",
  "SHOPIFY",
  "LOVABLE_TO_APP",
  "SAAS_MVP",
  "MOBILE_APP",
  "OTHER",
];

const TIMELINES: Timeline[] = ["asap", "1month", "3months", "flexible"];
const BUDGETS: Budget[] = ["<1k", "1k-3k", "3k-10k", "10k+", "undefined"];

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
};

const initialContact: ContactForm = {
  name: "",
  email: "",
  phone: "",
  message: "",
  consent: false,
};

export function Simulator() {
  const t = useTranslations("simulator");
  const locale = useLocale() as Locale;
  const reduceMotion = useReducedMotion();

  /* ---------- State ---------- */
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [answers, setAnswers] = useState<Record<string, FlowAnswer>>({});
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [contact, setContact] = useState<ContactForm>(initialContact);

  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ min: number; max: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------- Derived flow ---------- */
  const flow = serviceType ? SERVICE_FLOWS[serviceType] : null;

  /**
   * Linear step list:
   * 0          → service picker
   * 1..N       → service-specific dynamic steps
   * N+1        → timeline
   * N+2        → budget
   * N+3        → contact
   */
  const totalSteps = flow ? flow.steps.length + 4 : 1;
  const dynamicCount = flow?.steps.length ?? 0;

  const currentKind: "service" | "dynamic" | "timeline" | "budget" | "contact" = useMemo(() => {
    if (stepIdx === 0) return "service";
    if (flow && stepIdx <= dynamicCount) return "dynamic";
    if (stepIdx === dynamicCount + 1) return "timeline";
    if (stepIdx === dynamicCount + 2) return "budget";
    return "contact";
  }, [stepIdx, flow, dynamicCount]);

  const currentDynamicStep: FlowStep | null =
    currentKind === "dynamic" && flow ? flow.steps[stepIdx - 1] : null;

  /* ---------- Validity ---------- */
  const stepValid = useMemo(() => {
    switch (currentKind) {
      case "service":
        return serviceType !== null;
      case "dynamic":
        if (!currentDynamicStep) return false;
        return isStepValid(currentDynamicStep, answers[currentDynamicStep.id] ?? null);
      case "timeline":
        return timeline !== null;
      case "budget":
        return budget !== null;
      case "contact":
        return (
          contact.name.trim().length > 0 &&
          /^\S+@\S+\.\S+$/.test(contact.email) &&
          contact.consent
        );
    }
  }, [currentKind, serviceType, currentDynamicStep, answers, timeline, budget, contact]);

  /* ---------- Handlers ---------- */
  function pickService(s: ServiceType) {
    setServiceType(s);
    setAnswers({});
    track("simulator_started", { serviceType: s, locale });
  }

  function setSingle(stepId: string, value: string) {
    setAnswers((a) => ({ ...a, [stepId]: value }));
  }

  function toggleMulti(stepId: string, value: string) {
    setAnswers((a) => {
      const current = Array.isArray(a[stepId]) ? (a[stepId] as string[]) : [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...a, [stepId]: next };
    });
  }

  function setText(stepId: string, value: string) {
    setAnswers((a) => ({ ...a, [stepId]: value }));
  }

  function next() {
    if (stepIdx < totalSteps - 1) {
      const nextIdx = stepIdx + 1;
      setStepIdx(nextIdx);
      track("simulator_step_advanced", {
        from: stepIdx,
        to: nextIdx,
        kind: currentKind,
        serviceType,
      });
    }
  }

  function back() {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }

  async function submit() {
    if (!serviceType || !timeline || !budget) return;
    setSubmitting(true);
    setError(null);

    const estimate = computeEstimate({ serviceType, answers, timeline });

    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          answers,
          timeline,
          budget,
          email: contact.email,
          name: contact.name,
          phone: contact.phone || null,
          message: contact.message || null,
          consent: true,
          locale,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setDone(estimate);
      track("simulator_submitted", {
        serviceType,
        timeline,
        budget,
        estimateMin: estimate.min,
        estimateMax: estimate.max,
        locale,
      });
    } catch {
      setError(t("error"));
      track("simulator_failed", { serviceType, locale });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setServiceType(null);
    setAnswers({});
    setTimeline(null);
    setBudget(null);
    setContact(initialContact);
    setStepIdx(0);
    setDone(null);
  }

  /* ---------- Render ---------- */
  if (done) {
    return (
      <section
        id="simulator"
        className="relative scroll-mt-20 border-t border-border py-14 sm:py-20"
      >
        <div className="container-page max-w-2xl">
          <Result
            min={done.min}
            max={done.max}
            locale={locale}
            onReset={reset}
          />
        </div>
      </section>
    );
  }

  const motionProps = reduceMotion
    ? {
        initial: { opacity: 1, x: 0 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 1, x: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.2 },
      };

  return (
    <section id="simulator" className="relative scroll-mt-20 border-t border-border py-14 sm:py-20">
      <div className="container-page max-w-3xl">
        <SectionMarker
          number="02"
          label={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-10">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
              {t("step")} {stepIdx + 1} {t("of")} {totalSteps}
            </span>
            <div className="flex flex-1 gap-1 sm:max-w-[280px] sm:gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i <= stepIdx ? "bg-lime" : "bg-border",
                  )}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`step-${stepIdx}`} {...motionProps}>
              {currentKind === "service" && (
                <ServicePicker value={serviceType} onChange={pickService} />
              )}
              {currentKind === "dynamic" && currentDynamicStep && (
                <DynamicStepView
                  step={currentDynamicStep}
                  locale={locale}
                  answer={answers[currentDynamicStep.id] ?? null}
                  onSingle={(v) => setSingle(currentDynamicStep.id, v)}
                  onMulti={(v) => toggleMulti(currentDynamicStep.id, v)}
                  onText={(v) => setText(currentDynamicStep.id, v)}
                />
              )}
              {currentKind === "timeline" && (
                <TimelineStep value={timeline} onChange={setTimeline} />
              )}
              {currentKind === "budget" && <BudgetStep value={budget} onChange={setBudget} />}
              {currentKind === "contact" && (
                <ContactStep value={contact} onChange={setContact} />
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-6 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-2 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <Button
              variant="ghost"
              onClick={back}
              disabled={stepIdx === 0 || submitting}
              className="w-full justify-center sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </Button>
            {currentKind !== "contact" ? (
              <Button
                onClick={next}
                disabled={!stepValid}
                size="lg"
                className="w-full justify-center sm:w-auto"
              >
                {t("next")} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={!stepValid || submitting}
                size="lg"
                className="w-full justify-center sm:w-auto"
              >
                {submitting ? t("submitting") : t("submit")}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Step Components --------------------------- */

function ServicePicker({
  value,
  onChange,
}: {
  value: ServiceType | null;
  onChange: (s: ServiceType) => void;
}) {
  const t = useTranslations("simulator.step1");
  const to = useTranslations("simulator.step1.options");
  return (
    <div>
      <h3 className="text-2xl font-semibold tracking-tight">{t("title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SERVICE_OPTIONS.map((opt) => {
          const selected = value === opt;
          const range = SERVICE_PRICE_RANGES[opt];
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "group relative flex items-start gap-3 rounded-lg border bg-surface-2 p-4 text-left transition-colors",
                selected
                  ? "border-lime ring-lime"
                  : "border-border hover:border-foreground/30",
              )}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected ? "border-lime bg-lime text-primary-foreground" : "border-border",
                )}
              >
                {selected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">{to(opt)}</span>
                {opt !== "OTHER" && (
                  <span className="mt-1 block font-mono text-xs text-muted-foreground">
                    {range.min}€ – {range.max}€<span className="ml-0.5 text-lime">*</span>
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DynamicStepView({
  step,
  locale,
  answer,
  onSingle,
  onMulti,
  onText,
}: {
  step: FlowStep;
  locale: Locale;
  answer: FlowAnswer;
  onSingle: (v: string) => void;
  onMulti: (v: string) => void;
  onText: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="text-2xl font-semibold tracking-tight">{step.title[locale]}</h3>
      {step.subtitle && (
        <p className="mt-2 text-sm text-muted-foreground">{step.subtitle[locale]}</p>
      )}

      {step.kind === "single" && (
        <div className="mt-6 grid gap-2">
          {step.options.map((opt) => {
            const selected = answer === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSingle(opt.value)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border bg-surface-2 px-4 py-4 text-left transition-colors",
                  selected ? "border-lime" : "border-border hover:border-foreground/30",
                )}
                aria-pressed={selected}
              >
                <span className="text-sm text-foreground">{opt.label[locale]}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    selected ? "border-lime bg-lime text-primary-foreground" : "border-border",
                  )}
                >
                  {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {step.kind === "multi" && (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {step.options.map((opt) => {
            const checked = Array.isArray(answer) && answer.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border bg-surface-2 px-4 py-3 text-sm transition-colors",
                  checked ? "border-lime" : "border-border hover:border-foreground/30",
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => onMulti(opt.value)} />
                <span className="text-foreground">{opt.label[locale]}</span>
              </label>
            );
          })}
        </div>
      )}

      {step.kind === "text" && (
        <div className="mt-6">
          <Textarea
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onText(e.target.value)}
            placeholder={step.placeholder[locale]}
            rows={5}
          />
        </div>
      )}
    </div>
  );
}

function TimelineStep({
  value,
  onChange,
}: {
  value: Timeline | null;
  onChange: (v: Timeline) => void;
}) {
  const t = useTranslations("simulator.step3");
  const to = useTranslations("simulator.step3.options");
  return (
    <div>
      <h3 className="text-2xl font-semibold tracking-tight">{t("title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6 grid gap-2">
        {TIMELINES.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border bg-surface-2 px-4 py-4 text-left transition-colors",
                selected ? "border-lime" : "border-border hover:border-foreground/30",
              )}
              aria-pressed={selected}
            >
              <span className="text-sm text-foreground">{to(opt)}</span>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected ? "border-lime bg-lime text-primary-foreground" : "border-border",
                )}
              >
                {selected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BudgetStep({
  value,
  onChange,
}: {
  value: Budget | null;
  onChange: (v: Budget) => void;
}) {
  const t = useTranslations("simulator.step4");
  const to = useTranslations("simulator.step4.options");
  return (
    <div>
      <h3 className="text-2xl font-semibold tracking-tight">{t("title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6 grid gap-2">
        {BUDGETS.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border bg-surface-2 px-4 py-4 text-left transition-colors",
                selected ? "border-lime" : "border-border hover:border-foreground/30",
              )}
              aria-pressed={selected}
            >
              <span className="text-sm text-foreground">{to(opt)}</span>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected ? "border-lime bg-lime text-primary-foreground" : "border-border",
                )}
              >
                {selected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContactStep({
  value,
  onChange,
}: {
  value: ContactForm;
  onChange: (next: ContactForm) => void;
}) {
  const t = useTranslations("simulator.step5");
  function patch<K extends keyof ContactForm>(key: K, v: ContactForm[K]) {
    onChange({ ...value, [key]: v });
  }
  return (
    <div>
      <h3 className="text-2xl font-semibold tracking-tight">{t("title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sim-name">{t("name")}</Label>
          <Input
            id="sim-name"
            value={value.name}
            onChange={(e) => patch("name", e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sim-email">{t("email")}</Label>
          <Input
            id="sim-email"
            type="email"
            value={value.email}
            onChange={(e) => patch("email", e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="sim-phone">{t("phone")}</Label>
          <Input
            id="sim-phone"
            type="tel"
            value={value.phone}
            onChange={(e) => patch("phone", e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="sim-message">{t("message")}</Label>
          <Textarea
            id="sim-message"
            value={value.message}
            onChange={(e) => patch("message", e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
        <Checkbox
          checked={value.consent}
          onCheckedChange={(v) => patch("consent", v === true)}
          id="sim-consent"
          className="mt-0.5"
        />
        <span>{t("consent")}</span>
      </label>
    </div>
  );
}

/* ---------- Result ---------- */

function Result({
  min,
  max,
  locale,
  onReset,
}: {
  min: number;
  max: number;
  locale: string;
  onReset: () => void;
}) {
  const t = useTranslations("simulator.result");
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="rounded-2xl border border-border bg-surface p-8 sm:p-12 text-center ring-lime"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-lime/40 bg-lime/10 text-lime">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="mt-6 display text-3xl sm:text-4xl">{t("title")}</h3>
      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {t("rangeLabel")}
      </p>
      <p
        className="mt-2 font-mono font-semibold tabular-nums"
        style={{ fontSize: "clamp(2rem, 6vw, 3rem)" }}
      >
        {formatPriceRange(min, max, locale)}
      </p>
      <p className="mt-4 max-w-md mx-auto text-sm text-muted-foreground">{t("disclaimer")}</p>
      <p className="mt-6 text-base text-foreground">{t("next")}</p>
      <div className="mt-8 flex justify-center">
        <Button variant="secondary" size="lg" onClick={onReset}>
          {t("backHome")}
        </Button>
      </div>
    </motion.div>
  );
}
