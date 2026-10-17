import Link from "next/link";
import { CATEGORY_META } from "@/components/categoryMeta";
import { Icon, type IconName } from "@/components/icons";
import { CATEGORIES } from "@/lib/requirement.schema";

const primaryCta =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200";
const secondaryCta =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200";

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "clipboard",
    title: "Describe your event",
    body: "Add the event name, type, dates and location, then choose a planner, performer or crew.",
  },
  {
    icon: "sliders",
    title: "Add category requirements",
    body: "Answer a few questions that only apply to the category you picked.",
  },
  {
    icon: "wallet",
    title: "Share budget and details",
    body: "Set a budget or pay range and add any preferences or instructions.",
  },
  {
    icon: "send",
    title: "Review and submit",
    body: "Check the summary, edit anything, and submit. You get a requirement ID to look it up later.",
  },
];

const BENEFITS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "zap",
    title: "Convenient",
    body: "One guided form instead of scattered calls and messages. Your progress is saved on this device as you go, so a refresh won't lose your answers.",
  },
  {
    icon: "layers",
    title: "Organized requirements",
    body: "Every requirement follows the same clear structure (event basics, requirements, additional details), so nothing important gets missed.",
  },
  {
    icon: "target",
    title: "Category-specific requests",
    body: "Planners, performers and crew each get the questions that matter to them, from guest counts to equipment to shift hours.",
  },
];

function SectionHeading({ eyebrow, title, intro, id }: { eyebrow: string; title: string; intro: string; id: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{intro}</p>
    </div>
  );
}

/** Illustrative preview of what a finished requirement looks like (clearly labelled as an example). */
function ExampleRequirementCard() {
  return (
    <figure className="relative mx-auto w-full max-w-md" aria-label="Example of a posted requirement">
      <div aria-hidden="true" className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-brand-100/40 to-transparent blur-2xl" />
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-brand-900/5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Icon name="music" className="size-3.5" strokeWidth={2} />
            Performer
          </span>
          <span className="text-xs font-medium text-slate-400">Example</span>
        </div>
        <p className="mt-4 text-lg font-semibold text-ink">Sangeet Night</p>
        <dl className="mt-3 space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Icon name="calendar" className="size-4 text-slate-400" />
            <dt className="sr-only">Date</dt>
            <dd>Single evening · 3-hour performance</dd>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="mapPin" className="size-4 text-slate-400" />
            <dt className="sr-only">Location</dt>
            <dd>Jaipur, Rajasthan</dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Requirements</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {["Live band", "Bollywood & Sufi", "Group of 6", "Sound system"].map((t) => (
              <li key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
          <Icon name="check" className="size-4" strokeWidth={2.5} />
          Saved with a requirement ID
        </div>
      </div>
    </figure>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_70%_-10%,var(--color-brand-100),transparent_70%),radial-gradient(40rem_24rem_at_0%_10%,var(--color-brand-50),transparent_70%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700">
              <span className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              Event Planners · Performers · Crew
            </p>
            <h1 id="hero-title" className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
              Find the Right People for Your Event
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
              GoPratle connects you with event planners, performers and crew. Describe what you need once, in a clear,
              structured requirement, instead of explaining it over and over.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/post-requirement" className={primaryCta}>
                Post an Event Requirement
                <Icon name="arrowRight" className="size-5" />
              </Link>
              <Link href="/#how-it-works" className={secondaryCta}>
                See how it works
              </Link>
            </div>
          </div>
          <ExampleRequirementCard />
        </div>
      </section>

      {/* Services */}
      <section aria-labelledby="services-title" id="services" className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            id="services-title"
            eyebrow="Services"
            title="Who do you need?"
            intro="Choose the kind of professional you're looking for. Each category asks only the questions that matter for it."
          />
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {CATEGORIES.map((c) => {
              const meta = CATEGORY_META[c];
              return (
                <li
                  key={c}
                  className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/20">
                    <Icon name={meta.icon} className="size-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-ink">{meta.label}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{meta.summary}</p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-700">
                    {meta.examples.map((ex) => (
                      <li key={ex} className="flex items-center gap-2">
                        <Icon name="check" className="size-4 text-brand-600" strokeWidth={2.4} />
                        {ex}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/post-requirement?category=${c}`}
                    className="mt-7 inline-flex items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                  >
                    Post {/^[aeiou]/i.test(meta.label) ? "an" : "a"} {meta.label.toLowerCase()} requirement
                    <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-title" id="how-it-works" className="bg-gradient-to-b from-brand-50/60 to-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            id="how-title"
            eyebrow="How it works"
            title="Four short steps"
            intro="The form walks you through everything a professional needs to know. You can go back and change any answer before you submit."
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name={s.icon} className="size-5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-400">Step {i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Benefits */}
      <section aria-labelledby="benefits-title" id="benefits" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            id="benefits-title"
            eyebrow="Why GoPratle"
            title="Clear requirements, less back-and-forth"
            intro="A well-described requirement helps the right professional understand your event at a glance."
          />
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <li key={b.title} className="rounded-3xl bg-slate-50 p-7 ring-1 ring-slate-200/70">
                <span className="grid size-11 place-items-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
                  <Icon name={b.icon} className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{b.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{b.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section aria-labelledby="cta-title" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-14 text-center shadow-xl shadow-brand-900/10 sm:px-12">
          <h2 id="cta-title" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to describe your event?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-brand-100 sm:text-lg">
            Post your requirement in four guided steps and get a requirement ID you can use to look it up anytime.
          </p>
          <Link
            href="/post-requirement"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            Post an Event Requirement
            <Icon name="arrowRight" className="size-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
