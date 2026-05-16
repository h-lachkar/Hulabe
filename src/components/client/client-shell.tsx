"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, Folders, LifeBuoy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ClientShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("clientPortal.shell");

  const NAV = [
    { href: "/client", label: t("projects"), icon: Folders, exact: true },
    { href: "/client/support", label: t("support"), icon: LifeBuoy },
    { href: "/client/settings", label: t("account"), icon: Settings },
  ];

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/client/login";
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/client" className="flex items-center gap-3" aria-label="Hulabe">
            <Logo variant="auto" className="h-7 w-auto" />
            <span className="hidden rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime sm:inline">
              CLIENT
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "text-sm transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <span className="hidden truncate font-mono text-xs text-muted-foreground sm:inline">
              {userEmail}
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-lime"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 border-t border-border bg-bg/95 backdrop-blur md:hidden">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] uppercase tracking-wider",
                active ? "text-lime" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  );
}
