import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "kanek privacy policy — how we collect, use, and protect your data.",
};

const sections = [
  {
    num: "01",
    title: "Information We Collect",
    body: (
      <p>
        When you create a kanek account we collect your name, email address,
        phone number, and profile photo. When you post or accept a ride,
        delivery, errand, or job, we collect location data necessary to provide
        the service.
      </p>
    ),
  },
  {
    num: "02",
    title: "How We Use Your Information",
    body: (
      <ul className="space-y-2">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>To provide, maintain, and improve kanek services.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>To connect riders, drivers, senders, and helpers.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>To verify your identity and maintain trust &amp; safety.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>To send service-related notifications.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>To comply with applicable laws and regulations.</span>
        </li>
      </ul>
    ),
  },
  {
    num: "03",
    title: "Location Data",
    body: (
      <p>
        We collect location data only while you are actively using the app to
        post, browse, or fulfill a request. You can revoke location permissions
        at any time through your device settings.
      </p>
    ),
  },
  {
    num: "04",
    title: "Data Sharing",
    body: (
      <p>
        We do not sell your personal data. We share limited information with
        other kanek users only as necessary to facilitate a connection (e.g.
        your first name and approximate pickup location with a matched driver).
      </p>
    ),
  },
  {
    num: "05",
    title: "Data Security",
    body: (
      <p>
        We use industry-standard encryption and security practices to protect
        your data. All communication between the app and our servers is
        encrypted via TLS.
      </p>
    ),
  },
  {
    num: "06",
    title: "Data Retention",
    body: (
      <p>
        We retain your account data for as long as your account is active. You
        may request deletion of your account and associated data at any time by
        contacting{" "}
        <a
          href="mailto:support@kanek.bz"
          className="font-medium text-accent-green underline underline-offset-4 hover:text-accent-green/80 transition-colors"
        >
          support@kanek.bz
        </a>
        .
      </p>
    ),
  },
  {
    num: "07",
    title: "Children's Privacy",
    body: (
      <p>
        kanek is not intended for users under 18 years of age. We do not
        knowingly collect personal information from children.
      </p>
    ),
  },
  {
    num: "08",
    title: "Changes to This Policy",
    body: (
      <p>
        We may update this policy from time to time. We will notify you of
        material changes through the app or by email.
      </p>
    ),
  },
  {
    num: "09",
    title: "Contact Us",
    body: (
      <p>
        If you have questions about this privacy policy, contact us at{" "}
        <a
          href="mailto:support@kanek.bz"
          className="font-medium text-accent-green underline underline-offset-4 hover:text-accent-green/80 transition-colors"
        >
          support@kanek.bz
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-28 sm:py-36">
        <div className="pointer-events-none absolute -top-40 left-1/3 h-125 w-125 rounded-full bg-accent-green/5 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-100 w-100 rounded-full bg-accent-blue/5 blur-[120px]" />

        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green">
            Legal
          </p>
          <h1 className="mt-6 font-heading text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Your data belongs to you. Here&apos;s how we handle it — no
            legalese maze, just honest answers.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green" />
            Last updated: April 12, 2026
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {sections.map((s, i) => (
            <div
              key={s.num}
              className={`py-12 sm:py-14 ${
                i < sections.length - 1 ? "border-b border-border/30" : ""
              }`}
            >
              <div className="flex items-baseline gap-4 mb-4">
                <span className="font-mono text-sm font-bold text-accent-green/60">
                  {s.num}
                </span>
                <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                  {s.title}
                </h2>
              </div>
              <div className="pl-10 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer strip */}
      <section className="border-t border-border/40 bg-muted/30 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">
            Have concerns?{" "}
            <a
              href="mailto:support@kanek.bz"
              className="font-medium text-accent-green underline underline-offset-4 hover:text-accent-green/80 transition-colors"
            >
              Reach out anytime
            </a>
            . We take your privacy seriously.
          </p>
        </div>
      </section>
    </div>
  );
}
