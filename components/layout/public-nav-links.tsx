"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export type PublicNavLink = {
  href: string;
  label: string;
};

type PublicNavLinksProps = {
  links: PublicNavLink[];
  className?: string;
  linkClassName?: string;
};

export function PublicNavLinks({
  links,
  className,
  linkClassName,
}: PublicNavLinksProps) {
  const pathname = normalizePath(usePathname());

  return (
    <nav className={className}>
      {links.map((item) => {
        const href = normalizePath(item.href);
        const isActive =
          pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              isActive
                ? "font-extrabold text-black"
                : "transition hover:text-[var(--foreground)]",
              linkClassName,
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}
