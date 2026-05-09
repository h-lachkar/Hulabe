import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-bg text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
          <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            404
          </p>
          <h1 className="display text-5xl">Page introuvable.</h1>
          <Link
            href="/"
            className="rounded-md bg-lime px-5 py-2 text-sm font-semibold text-bg hover:bg-lime-dark"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </body>
    </html>
  );
}
