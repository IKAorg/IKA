import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

const aboutSections = [
  {
    title: "About the IKA",
    image: "/images/about/about-intro.webp",
    body: [
      "The International Kempo Association was established in order to bring together practitioners of a particular family of martial arts from all over the world.",
      "Although member organisations use different names to describe their martial art, all of them share a common heritage, physical style, and most importantly of all: philosophy.",
      "The International Kempo Association brings all these organisations together, so that they can train together for mutual self-development, fun, and good company.",
    ],
  },
  {
    title: "What unites the IKA Kempo family?",
    image: "/images/about/kobe-2015.webp",
    body: [
      "The Kempo family of martial arts which make up the International Kempo Association are traditional Japanese martial arts, but can trace their heritage back to the Shaolin Temple in China.",
      "They are qualitatively different from both Chinese martial arts and Japanese karate styles.",
    ],
    bullets: [
      "They train in both hard techniques, such as kicks, punches and blocks, and soft techniques, such as throws, grappling and nerve point attacks.",
      "They train to develop both the mind and the body through physical training combined with meditation and philosophy.",
      "They emphasise compassion together with the strength of self-reliance.",
      "They practice in pairs to increase the speed of learning as well as building relationships.",
      "Their style comprises techniques that incapacitate with the minimum strength required by the defender and the minimum damage inflicted on the opponent.",
      "They place a strong emphasis on defence rather than attack.",
    ],
    note: "Kempo, or kenpo, is a term for several Japanese styles of martial arts and is shared by many members of the IKA. It is the Japanese reading of the Chinese quan fa, made up of ken, meaning fist, and ho, meaning method or system.",
  },
  {
    title: "History",
    image: "/images/about/history.webp",
    body: [
      "The founding members of the IKA originally met at the British Shorinji Kempo Federation's 40th anniversary celebrations in London, 2014.",
      "At a meeting after this event they pledged to cooperate to share teaching expertise and facilitate training across national borders and continental divides.",
      "The word Shorinji is the Japanese reading of the Chinese Shaolinsi, meaning Shaolin temple.",
    ],
  },
  {
    title: "Philosophy",
    image: "/images/about/philosophy.webp",
    body: [
      "All of the members of the IKA are united in the desire to develop individuals so that they can be confident and self-reliant enough to make a positive difference within their societies.",
      "This was best summarised by So Doshin, the founder of Shorinji Kempo, as living half for yourselves, and half for others.",
      "During training, students practice with each other for mutual development, not personal competition.",
    ],
  },
  {
    title: "Techniques",
    image: "/images/about/techniques.webp",
    body: [
      "The techniques practiced match the philosophy taught in classes. All of the techniques use principles that allow a less powerful defender to overcome a more powerful attacker.",
    ],
    bullets: [
      "By focusing on the natural weak points of the attacker's body, such as striking or applying pressure to nerve junctions.",
      "By using the attacker's instinctive reactions to influence and control their movements, for instance by interfering with their balance strategy.",
      "By understanding the mechanical principles that the human body is built upon, such as using joint reversals to throw.",
      "By using and redirecting the momentum of the attacker.",
    ],
    note: "The techniques form the defence to an attack and allow the defender to incapacitate the attacker with the minimum amount of damage.",
  },
];

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";

  return (
    <div>
      <section className="mx-auto max-w-7xl px-5 py-14">
        <Link
          href={`/${safeLocale}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to homepage
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          About IKA
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
          About the International Kempo Association
        </h1>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="grid gap-8">
          {aboutSections.map((section, index) => (
            <article
              key={section.title}
              className="grid overflow-hidden border border-[var(--line)] bg-white lg:grid-cols-[0.34fr_0.66fr]"
            >
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <Image
                  src={section.image}
                  alt={section.title}
                  width={900}
                  height={700}
                  className="h-full min-h-[260px] w-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <div className="mt-5 space-y-4 text-base leading-8 text-[var(--muted)]">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="mt-5 space-y-3 text-base leading-7 text-[var(--muted)]">
                    {section.bullets.map((item) => (
                      <li key={item} className="border-l-2 border-[var(--accent)] pl-4">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.note ? (
                  <p className="mt-5 border-t border-[var(--line)] pt-5 text-sm leading-7 text-[var(--muted)]">
                    {section.note}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <blockquote className="mt-10 border-l-4 border-[var(--accent)] bg-white p-6 text-2xl font-semibold leading-tight text-[var(--ink-blue)]">
          Avoid rather than fight,
          <br />
          Fight rather than hurt,
          <br />
          Hurt rather than maim,
          <br />
          Maim rather than kill,
          <br />
          For all life is precious and cannot be replaced.
        </blockquote>
      </section>
    </div>
  );
}
