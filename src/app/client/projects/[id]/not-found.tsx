import Link from "next/link";
import { Folders } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <Folders className="mx-auto h-6 w-6 text-muted-2" />
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 display text-3xl">Projet introuvable.</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Cette URL ne pointe vers aucun projet associé à ton compte.
      </p>
      <Link
        href="/client"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-semibold text-bg hover:bg-lime-dark"
      >
        Retour à mes projets
      </Link>
    </div>
  );
}
