import type { TextBlock } from "@/lib/i18n/public-pages";

export function PublicContentBlocks({ blocks }: { blocks?: TextBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2">
      {blocks.map((block) => (
        <article
          key={`${block.title}-${block.text}`}
          className="border border-[var(--line)] bg-white p-5"
        >
          {block.title ? (
            <h2 className="text-xl font-semibold">{block.title}</h2>
          ) : null}
          {block.text ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {block.text}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
