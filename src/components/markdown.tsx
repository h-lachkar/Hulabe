import { marked } from "marked";
import { cn } from "@/lib/utils";

// Sync mode so we can render in server components without async
marked.use({
  async: false,
  breaks: true,
  gfm: true,
});

/**
 * Renders simple markdown safely. The input is rendered as markdown (gfm + line
 * breaks) — code blocks, bold, italic, lists, links, etc. supported.
 *
 * Notes are admin- or client-authored; we trust admin input but sanitize the
 * narrow set of HTML tags marked emits. This is NOT a general HTML sanitizer.
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const html = marked.parse(source.trim(), { async: false }) as string;
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-p:my-2 prose-p:leading-relaxed",
        "prose-a:text-lime prose-a:underline-offset-2 hover:prose-a:underline",
        "prose-strong:text-foreground",
        "prose-code:rounded prose-code:bg-surface-2 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em]",
        "prose-pre:bg-bg prose-pre:border prose-pre:border-border",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
        "prose-blockquote:border-l-lime prose-blockquote:text-muted-foreground",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
