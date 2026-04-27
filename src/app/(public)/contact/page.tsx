import { Mail, MessageSquare, MapPin, ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is kanek free?",
    a: "kanek is free to join, browse, and post. If you use E-Kyash inside the platform, a 3% fee helps run the app and support the community.",
  },
  {
    q: "Where is kanek available?",
    a: "kanek is built for Belize and covers all six districts.",
  },
  {
    q: "How do I know a user is trustworthy?",
    a: "Every user has a verified profile with ratings and reviews from real trips.",
  },
  {
    q: "Can I use kanek to send packages?",
    a: "Absolutely. Post a delivery request and connect with someone heading in the right direction.",
  },
];

export default function ContactPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative overflow-hidden py-32 sm:py-44">
        <div className="pointer-events-none absolute -top-32 right-1/4 h-125 w-125 rounded-full bg-accent-blue/6 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-100 w-100 rounded-full bg-accent-green/6 blur-[100px]" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green">
              Contact
            </p>
            <h1 className="mt-6 font-heading text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
              Let&apos;s <span className="text-accent-green">talk.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
              Have a question, idea, or just want to say hi? We&apos;re
              real people building for our community. We read every message.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {[
            {
              icon: Mail,
              label: "General inquiries",
              value: "hello@kanek.bz",
              href: "mailto:hello@kanek.bz",
              desc: "Partnerships, press, or just saying hello.",
            },
            {
              icon: MessageSquare,
              label: "Support",
              value: "support@belizechain.org",
              href: "mailto:support@belizechain.org",
              desc: "Need help with the app? Report a bug or get assistance.",
            },
            {
              icon: MapPin,
              label: "Location",
              value: "Belize, Central America",
              href: undefined,
              desc: "Built with love from the Jewel.",
            },
          ].map((channel, i) => {
            const Icon = channel.icon;
            return (
            <div
              key={channel.label}
              className={`flex flex-col gap-6 border-b border-border/40 py-14 md:flex-row md:items-center md:justify-between ${
                i === 2 ? "border-b-0" : ""
              }`}
            >
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-green/10">
                  <Icon className="h-6 w-6 text-accent-green" />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    {channel.label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {channel.desc}
                  </p>
                </div>
              </div>

              <div>
                {channel.href ? (
                  <a
                    href={channel.href}
                    className="font-heading text-2xl font-bold text-accent-green transition-colors hover:text-accent-green/80 sm:text-3xl"
                  >
                    {channel.value}
                  </a>
                ) : (
                  <p className="font-heading text-2xl font-bold sm:text-3xl">
                    {channel.value}
                  </p>
                )}
              </div>
            </div>
          )})}
        </div>
      </section>

      <section className="bg-muted/30 py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green">
              FAQ
            </p>
            <h2 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              Common questions.
            </h2>
          </div>

          <div className="mt-16">
            {faqs.map((faq) => (
              <details key={faq.q} className="border-b border-border/40 py-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                  <span className="font-heading text-lg font-semibold sm:text-xl">
                    {faq.q}
                  </span>
                  <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                </summary>
                <p className="pt-3 leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-forest-900 py-28 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(73,103,246,0.08),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div>
            <h2 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              We&apos;re building this
              <br />
              <span className="text-neon-green">together.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
              kanek belongs to the community. Your feedback shapes what we build
              next. Don&apos;t be a stranger.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
