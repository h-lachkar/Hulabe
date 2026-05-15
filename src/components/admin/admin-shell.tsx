"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Folders,
  Receipt,
  LifeBuoy,
  Settings,
  LogOut,
  ExternalLink,
  Users,
} from "lucide-react";
import type { AdminRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/projects", label: "Projects", icon: Folders },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
];

const ROLE_COLOR: Record<AdminRole, string> = {
  OWNER: "border-lime/30 bg-lime/10 text-lime",
  ADMIN: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  VIEWER: "border-border bg-surface-2 text-muted-foreground",
};

export function AdminShell({
  children,
  userEmail,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName?: string | null;
  userRole: AdminRole;
}) {
  const pathname = usePathname();
  const isOwner = userRole === "OWNER";

  const secondary = [
    ...(isOwner
      ? [{ href: "/admin/team", label: "Team", icon: Users }]
      : []),
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface/40 lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <Logo variant="dark" className="h-7 w-auto" />
          <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-lime" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <nav className="space-y-1">
            {secondary.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface-2 text-foreground"
                      : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <a
              href="https://eu.posthog.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-2/60 hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              PostHog
            </a>
          </nav>

          <div className="mt-4 rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Signed in
              </p>
              <span
                className={cn(
                  "inline-flex rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                  ROLE_COLOR[userRole],
                )}
              >
                {userRole.toLowerCase()}
              </span>
            </div>
            {userName && (
              <p className="mt-1 truncate text-sm font-medium text-foreground">{userName}</p>
            )}
            <p className={cn("truncate font-mono text-xs", userName ? "text-muted-foreground" : "mt-1 text-sm text-foreground")}>{userEmail}</p>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-lime"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Logo variant="dark" className="h-6 w-auto" />
            <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime">
              ADMIN
            </span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-lime"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-bg/95 backdrop-blur lg:hidden">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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

        <main className="flex-1 overflow-x-hidden pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
