import Link from "next/link";
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Contact
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
        Get in touch with the International Kempo Association.
      </h1>
      <div className="mt-8 max-w-2xl border border-[var(--line)] bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center bg-[var(--ink-blue)] text-white">
            <Mail size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-[var(--muted)]">Email</p>
            <Link
              href="mailto:internationalkempoassociation@gmail.com"
              className="font-semibold"
            >
              internationalkempoassociation@gmail.com
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
