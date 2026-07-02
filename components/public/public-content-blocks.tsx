import Image from "next/image";
import type { TextBlock } from "@/lib/i18n/public-pages";

export function PublicContentBlocks({ blocks }: { blocks?: TextBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 grid gap-6">
      {blocks.map((block, index) => (
        <article
          key={`${block.title}-${block.text}`}
          className={
            block.image
              ? "grid overflow-hidden border border-[var(--line)] bg-white lg:grid-cols-[0.34fr_0.66fr]"
              : "border border-[var(--line)] bg-white p-5"
          }
        >
          {block.image ? (
            <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
              <Image
                src={block.image}
                alt={block.alt || block.title}
                width={900}
                height={700}
                className="h-full min-h-[260px] w-full object-cover"
              />
            </div>
          ) : null}
          <div className={block.image ? "p-6 md:p-8" : undefined}>
            {block.title ? (
              <h2 className="text-xl font-semibold">{block.title}</h2>
            ) : null}
            {block.text ? (
              <div className="mt-3 space-y-4 text-sm leading-7 text-[var(--muted)]">
                {block.text.split("\n\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {block.items && block.items.length > 0 ? (
              <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--muted)]">
                {block.items.map((item) => (
                  <li
                    key={item}
                    className="border-l-2 border-[var(--accent)] pl-4"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            {block.note ? (
              <p className="mt-5 border-t border-[var(--line)] pt-5 text-sm leading-7 text-[var(--muted)]">
                {block.note}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
