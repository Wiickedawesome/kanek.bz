import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Code,
  Megaphone,
  PenTool,
  Users,
  Heart,
  ArrowRight,
} from "lucide-react";

const roles = [
  {
    icon: Code,
    title: "Builders & Developers",
    description:
      "Write code, design systems, and help shape the platform. kanek is open to collaborators who want to build real technology for Belize.",
    color: "from-accent-green/20 to-accent-green/5",
  },
  {
    icon: Megaphone,
    title: "Community Ambassadors",
    description:
      "Spread the word in your district. Help onboard riders, drivers, and senders. Be the voice of kanek in your town.",
    color: "from-accent-blue/20 to-accent-blue/5",
  },
  {
    icon: PenTool,
    title: "Creatives & Storytellers",
    description:
      "Design, write, photograph, film — help tell the story of community mobility in Belize.",
    color: "from-neon-green/20 to-neon-green/5",
  },
  {
    icon: Users,
    title: "Local Partners",
    description:
      "Businesses, organizations, and community leaders who want to integrate kanek into their operations or support the movement.",
    color: "from-accent-green/20 to-accent-green/5",
  },
];

export default function JoinPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative overflow-hidden py-32 sm:py-44">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-150 w-150 rounded-full bg-neon-green/6 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-100 w-100 rounded-full bg-accent-blue/6 blur-[100px]" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green">
              Join the movement
          </p>
          <h1 className="mt-6 font-heading text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
              Make Belize
              <br />
              <span className="text-accent-green">the best.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
              kanek isn&apos;t a company looking for employees. It&apos;s a
              community looking for people who give a damn — builders,
              connectors, dreamers, doers. If you want to make a change, you
              belong here.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-forest-900 py-32 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(101,246,123,0.08),transparent_60%)]" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="space-y-6">
            <p className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              No investors.
            </p>
            <p className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-neon-green sm:text-5xl md:text-6xl">
              No shareholders.
            </p>
            <p className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Just people who care.
            </p>
            <p className="max-w-2xl pt-4 text-lg text-white/60 sm:text-xl">
              We&apos;re not building for Silicon Valley. We&apos;re building
              for Belize City, San Ignacio, Orange Walk, Dangriga, Punta Gorda,
              and Corozal. Every district, every road, every community.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green">
              Where you fit
            </p>
            <h2 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              Find your role.
            </h2>
          </div>

          {roles.map((role, i) => {
            const isEven = i % 2 === 0;
            const Icon = role.icon;
            return (
              <div
                key={role.title}
                className={`flex flex-col items-center gap-8 py-16 md:flex-row ${
                  isEven ? "" : "md:flex-row-reverse"
                }`}
              >
                <div className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-linear-to-br ${role.color}`}>
                  <Icon className="h-10 w-10 text-foreground" />
                </div>

                <div className={`${isEven ? "md:text-left" : "md:text-right"} text-center`}>
                  <h3 className="font-heading text-2xl font-bold sm:text-3xl">
                    {role.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-lg text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-muted/30 py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green">
              What you get
            </p>
            <h2 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              More than a title.
            </h2>
          </div>

          <div className="mt-20 grid gap-12 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Real impact",
                desc: "Your work directly improves how thousands of Belizeans move, send, and connect every day.",
              },
              {
                num: "02",
                title: "A network",
                desc: "Connect with builders, creators, and leaders across all six districts who share your vision.",
              },
              {
                num: "03",
                title: "Your name on it",
                desc: "This isn't charity work — it's legacy. Be part of building something Belize has never had.",
              },
            ].map((step) => (
              <div key={step.num}>
                <span className="block font-heading text-7xl font-black text-accent-green/15 sm:text-8xl">
                  {step.num}
                </span>
                <h3 className="-mt-4 font-heading text-2xl font-bold">
                  {step.title}
                </h3>
                <p className="mt-3 text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-linear-to-br from-forest-900 via-forest-800 to-forest-900 py-28 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(101,246,123,0.06),transparent_70%)]" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div>
            <Heart className="mx-auto h-12 w-12 text-neon-green/60" />
            <h2 className="mt-8 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              Ready to build something
              <br />
              <span className="text-neon-green">that matters?</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
              Drop us a line. Tell us who you are, what you&apos;re good at, and
              how you want to help. No résumé needed — just heart.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                render={<a href="mailto:hello@kanek.bz" />}
                size="lg"
                className="bg-neon-green hover:bg-neon-green/90 text-forest-900 font-bold px-10 py-6 text-lg"
              >
                hello@kanek.bz
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                render={<Link href="/contact" />}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-10 py-6 text-lg"
              >
                Other ways to reach us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
