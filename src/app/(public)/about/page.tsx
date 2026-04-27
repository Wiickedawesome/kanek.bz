import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
const timeline = [
  {
    num: "01",
    title: "The question everyone asks",
    body:
      "How do I get from here to there? If you do not own a car in Belize, that question defines the day. Buses run limited routes with no night service. Taxis are expensive. Most people figure it out through WhatsApp groups and sheer luck.",
  },
  {
    num: "02",
    title: "Empty seats, full roads",
    body:
      "Thousands of drivers cross the country daily with empty seats. Freelancers hunt for gigs by word of mouth. Packages move through informal networks with zero accountability. The capacity already exists. It just has not been connected.",
  },
  {
    num: "03",
    title: "So we built the board",
    body:
      "kanek connects rides, deliveries, errands, and jobs on a single community board. No venture capital. No algorithm deciding your fare. Just neighbors solving a problem together.",
  },
];

const beliefs = [
  {
    title: "Community first",
    text: "kanek is a tool the community owns. Every feature exists because Belizeans asked for it.",
  },
  {
    title: "Made in Belize",
    text: "Built by people who know these roads, this culture, and the real distances between districts.",
  },
  {
    title: "Trust is earned",
    text: "Verified profiles, real ratings, and clear review flows matter more than gimmicks.",
  },
  {
    title: "No middleman",
    text: "Drivers and riders connect directly. No corporate cut. No surge. The price is between you and your neighbor.",
  },
];

const stats = [
  { value: "6", label: "Districts" },
  { value: "400K+", label: "Population" },
  { value: "0", label: "Ride-share apps" },
  { value: "1", label: "kanek" },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative overflow-hidden bg-forest-900 py-28 text-white sm:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(81,193,82,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(73,103,246,0.12),transparent_45%)]" />
        <div className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-accent-green/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-green">
            The story
          </p>
          <h1 className="mt-8 font-heading text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-tighter">
            <span className="block">400,000</span>
            <span className="block text-accent-green">people.</span>
            <span className="block">Zero</span>
            <span className="block">ride-share.</span>
          </h1>
          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
            Belize has six districts, one highway, and no app to get you from one
            to the other. kanek starts with the way Belize already moves and gives
            it a clearer, safer board.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden py-32 sm:py-44">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="space-y-4">
            <p className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tight">
              No bus after 6 PM.
            </p>
            <p className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tight text-accent-green">
              Hitchhiking is the backup plan.
            </p>
            <p className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tight">
              Packages cost more than what&apos;s inside.
            </p>
          </div>
          <p className="mt-12 max-w-2xl text-xl leading-relaxed text-muted-foreground">
            Drivers cross the country every day with empty seats. Freelancers
            search for gigs by word of mouth. Nobody&apos;s connected any of it.
          </p>
        </div>
      </section>

      <section className="bg-forest-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-44">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <span className="inline-block select-none font-heading text-[10rem] font-black leading-none text-neon-green/10 sm:text-[14rem]">
                &ldquo;
              </span>
              <h2 className="-mt-24 font-heading text-4xl font-extrabold leading-tight tracking-tight sm:-mt-32 sm:text-5xl md:text-6xl">
                A board.
                <br />
                Not an app
                <br />
                <span className="text-neon-green">telling you what to do.</span>
              </h2>
            </div>

            <div className="flex flex-col justify-center space-y-8">
              {[
                "Post a ride, a delivery, an errand, or a job.",
                "Anyone heading that direction picks it up.",
                "No fleet. No algorithms deciding your fare.",
                "Just people who know these roads helping each other move.",
              ].map((line) => (
                <p key={line} className="text-xl leading-relaxed text-white/60 sm:text-2xl">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-border/50 bg-background py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10 px-4 text-center sm:px-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-heading text-5xl font-black text-accent-green sm:text-6xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm tracking-wide text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-32 sm:py-44">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-green">
            How we got here
          </p>

          <div className="mt-20 space-y-32">
            {timeline.map((item, index) => {
              const reverse = index % 2 === 1;
              return (
                <div
                  key={item.num}
                  className={`grid gap-8 lg:gap-16 ${
                    reverse ? "lg:grid-cols-[2fr_1fr]" : "lg:grid-cols-[1fr_2fr]"
                  }`}
                >
                  {!reverse && (
                    <span className="self-start font-heading text-[8rem] font-black leading-none text-accent-green/10 sm:text-[10rem]">
                      {item.num}
                    </span>
                  )}
                  <div className="self-center">
                    <h3 className="font-heading text-3xl font-bold sm:text-4xl">
                      {item.title}
                    </h3>
                    <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                  {reverse && (
                    <span className="self-start text-right font-heading text-[8rem] font-black leading-none text-accent-green/10 sm:text-[10rem]">
                      {item.num}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-forest-900 text-white py-32 sm:py-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(101,246,123,0.04),transparent_70%)]" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neon-green">
            What we believe
          </p>

          <div className="mt-20 grid gap-px bg-white/10 sm:grid-cols-2">
            {beliefs.map((belief) => (
              <div
                key={belief.title}
                className="cursor-default bg-forest-900 p-10 transition-colors duration-300 hover:bg-white/5 sm:p-14"
              >
                <h3 className="font-heading text-2xl font-bold sm:text-3xl">
                  {belief.title}
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-white/50">
                  {belief.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-32 sm:py-44">
        <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-accent-green/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent-blue/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-heading text-5xl font-black tracking-tight sm:text-6xl md:text-7xl">
            Built for Belize.
            <br />
            <span className="text-accent-green">By Belizeans.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-xl text-muted-foreground">
            Every road, every route, every district — we know this country
            because we live here.
          </p>
          <div className="mt-12">
            <Button
              render={<Link href="/download" />}
              size="lg"
              className="bg-accent-green px-12 py-6 text-lg font-bold text-white hover:bg-accent-green/90"
            >
              Get kanek
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
