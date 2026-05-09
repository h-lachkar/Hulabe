"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

let initialized = false;

function init() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // we handle this manually for app-router
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      // PostHog masks <input>, <textarea> by default. Keep that for GDPR/RGPD.
      maskAllInputs: true,
      // Free-form text on the page is NOT masked (so we see scroll, hover, clicks).
      maskTextSelector: "[data-private]",
    },
    persistence: "localStorage+cookie",
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug(false);
    },
  });
  initialized = true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    init();
  }, []);

  if (!POSTHOG_KEY) {
    // Render children without provider when key is missing — avoids breaking dev.
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph || !pathname) return;
    const url = window.location.origin + pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

/** Convenience helper to capture events from anywhere in client code. */
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}
