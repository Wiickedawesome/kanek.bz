import Link from "next/link";
import { ArrowRight, BellRing, Shield, Smartphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DownloadPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative overflow-hidden bg-forest-900 py-28 text-white sm:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(101,246,123,0.15),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(73,103,246,0.14),transparent_40%)]" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neon-green">
            Download
          </p>
          <h1 className="mt-8 max-w-4xl font-heading text-[clamp(3rem,8vw,6.5rem)] font-black leading-[0.92] tracking-tighter">
            kanek is getting ready
            <br />
            for your pocket.
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-white/70 sm:text-2xl">
            The app experience is being polished for launch. If you want early access
            or launch updates, reach out now and we will keep you in the loop.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button
              render={<a href="mailto:hello@kanek.bz?subject=kanek%20launch%20updates" />}
              size="lg"
              className="bg-neon-green px-10 py-6 text-lg font-bold text-forest-900 hover:bg-neon-green/90"
            >
              Get Launch Updates
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              render={<Link href="/about" />}
              variant="outline"
              size="lg"
              className="border-white/20 px-10 py-6 text-lg text-white hover:bg-white/10"
            >
              Read the Story
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
          {[
            {
              icon: Smartphone,
              title: "Built for the real trip",
              text: "Rides, deliveries, errands, and local work live in one product instead of being scattered across chats.",
            },
            {
              icon: Shield,
              title: "Trust before hype",
              text: "Verification, ratings, and moderation matter more than flashy launch theatrics.",
            },
            {
              icon: Users,
              title: "Community-led rollout",
              text: "The first release is aimed at real Belizean usage, not vanity metrics or speculative growth.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl border bg-card p-8 shadow-sm">
                <div className="inline-flex rounded-2xl bg-accent-green/10 p-4 text-accent-green">
                  <Icon className="h-7 w-7" />
                </div>
                <h2 className="mt-6 font-heading text-2xl font-bold">{item.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-[2rem] border bg-background p-8 sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green">
                  What to expect
                </p>
                <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  Clear updates. No fake store buttons.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Until the mobile release is ready, this page stays honest. If you want
                  to be notified when kanek opens up, send a note and we will add you to
                  the launch updates list.
                </p>
              </div>
              <div className="rounded-3xl border border-accent-green/20 bg-accent-green/5 p-6 text-sm text-muted-foreground lg:max-w-sm">
                <BellRing className="mb-4 h-6 w-6 text-accent-green" />
                Launch updates are handled manually right now so the first wave stays
                intentional and supportable.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
