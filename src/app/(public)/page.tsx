import Link from "next/link";
import {
  MapPin,
  Package,
  ShoppingBag,
  Briefcase,
  Shield,
  Radio,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/ui/home-hero";

const features = [
  {
    icon: MapPin,
    title: "Rides & Routes",
    description:
      "Share your commute or post a ride. Connecting drivers and riders across districts.",
  },
  {
    icon: Package,
    title: "Package Delivery",
    description:
      "Need something moved from Belize City to San Ignacio? Post it and let the community deliver.",
  },
  {
    icon: ShoppingBag,
    title: "Errands",
    description:
      "Groceries, pickups, drop-offs — post what you need and let someone nearby help out.",
  },
  {
    icon: Briefcase,
    title: "Jobs & Gigs",
    description:
      "Quick gigs and local opportunities. Find work or hire help in your community.",
  },
  {
    icon: Shield,
    title: "Trust Profiles",
    description:
      "Verified users, ratings, and reviews. Know who you're riding with before you go.",
  },
  {
    icon: Radio,
    title: "Live Tracking",
    description:
      "Real-time location sharing so your people always know you're safe on the road.",
  },
];

const steps = [
  {
    num: "01",
    title: "Post or browse",
    desc: "Need a ride? Sending a package? Post it on the board or browse what is already moving nearby.",
  },
  {
    num: "02",
    title: "Connect",
    desc: "Match with a verified community member heading your way. Chat, confirm the details, and agree on the plan.",
  },
  {
    num: "03",
    title: "Move",
    desc: "Track in real time, arrive safe, and leave a review. Trust grows one completed trip at a time.",
  },
];

const stats = [
  { value: "6", suffix: "", label: "Districts connected" },
  { value: "0", suffix: "%", label: "Surge pricing" },
  { value: "100", suffix: "%", label: "Community-owned" },
  { value: "24", suffix: "/7", label: "Availability" },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      <HomeHero />

      <section className="relative overflow-hidden bg-background py-28">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent-green/8 blur-3xl" />
        <div className="relative mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
          <p className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            No corporate fleet.
          </p>
          <p className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-accent-green sm:text-5xl md:text-6xl">
            No surge pricing.
          </p>
          <p className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Just your neighbors.
          </p>
          <p className="max-w-2xl pt-4 text-lg text-muted-foreground sm:text-xl">
            kanek is a board, not an app telling people what to do. Post rides,
            deliveries, errands, and jobs. Or pick one up. The community decides.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-12 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            One board. Everything moves.
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const number = String(index + 1).padStart(2, "0");
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-accent-green/20 bg-card p-8 shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:border-accent-green/40"
                >
                  <div className="absolute right-4 top-4 select-none text-[120px] font-bold leading-none text-accent-green/5">
                    {number}
                  </div>
                  <div className="relative z-10">
                    <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-linear-to-br from-accent-green/10 to-neon-green/10 p-4 text-accent-green shadow-lg shadow-accent-green/20">
                      <Icon className="h-12 w-12" />
                    </div>
                    <div className="mb-4 inline-block rounded-full border border-accent-green/20 bg-accent-green/10 px-4 py-1 font-mono text-sm font-semibold text-accent-green">
                      {number}
                    </div>
                    <h3 className="mb-3 font-heading text-2xl font-bold transition-colors duration-300 group-hover:text-accent-green">
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-background py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 text-center sm:px-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-heading text-5xl font-black text-accent-green sm:text-6xl">
                {stat.value}
                {stat.suffix}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-forest-900 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(81,193,82,0.1),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(101,246,123,0.12),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps. That&apos;s it.
          </h2>

          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.num}>
                <span className="block font-heading text-8xl font-black text-neon-green/20 sm:text-9xl">
                  {step.num}
                </span>
                <h3 className="-mt-4 font-heading text-2xl font-bold">{step.title}</h3>
                <p className="mt-3 text-white/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto max-w-3xl px-4 pt-16 pb-28 text-center sm:px-6">
          <h2 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Ready to move?
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Download kanek and join a growing community of Belizeans helping each
            other get from A to B.
          </p>
          <div className="mt-10">
            <Button
              render={<Link href="/download" />}
              size="lg"
              className="bg-neon-green px-12 py-6 text-lg font-bold text-forest-900 hover:bg-neon-green/90"
            >
              Get kanek Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
