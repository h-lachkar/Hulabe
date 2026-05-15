import { ClientShell } from "@/components/client/client-shell";
import { requireClient } from "@/lib/client/auth";

export default async function ClientShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireClient();
  return <ClientShell userEmail={user.email ?? ""}>{children}</ClientShell>;
}
