import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "kanek terms of service — the rules for using our community mobility platform.",
};

const sections = [
  {
    num: "01",
    title: "Acceptance of Terms",
    body: (
      <p>
        By downloading, installing, or using the kanek mobile application
        (&ldquo;the App&rdquo;), you agree to be bound by these Terms of
        Service. If you do not agree, do not use the App.
      </p>
    ),
  },
  {
    num: "02",
    title: "Description of Service",
    body: (
      <p>
        kanek is a community mobility board that allows users in Belize to post
        and accept rides, package deliveries, errands, and jobs. kanek is a
        platform — we do not provide transportation or delivery services
        directly.
      </p>
    ),
  },
  {
    num: "03",
    title: "Eligibility",
    body: (
      <p>
        You must be at least 18 years old and legally able to enter into
        agreements to use kanek. By using the App, you represent and warrant
        that you meet these requirements.
      </p>
    ),
  },
  {
    num: "04",
    title: "User Accounts",
    body: (
      <ul className="space-y-2">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>You are responsible for maintaining the security of your account.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>You agree to provide accurate and complete information.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>You may not create multiple accounts or impersonate others.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            We reserve the right to suspend or terminate accounts that violate
            these terms.
          </span>
        </li>
      </ul>
    ),
  },
  {
    num: "05",
    title: "User Conduct",
    body: (
      <>
        <p className="mb-3">You agree not to:</p>
        <ul className="space-y-2">
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            <span>Use the App for any unlawful purpose.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            <span>Harass, threaten, or discriminate against other users.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            <span>Post false, misleading, or fraudulent content.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            <span>Attempt to access other users&apos; accounts or data.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            <span>Interfere with the operation of the App.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    num: "06",
    title: "Community Transactions",
    body: (
      <p>
        All arrangements made through kanek (rides, deliveries, errands, jobs)
        are between the participating users. kanek is not a party to these
        transactions and is not responsible for the quality, safety, or legality
        of the services exchanged.
      </p>
    ),
  },
  {
    num: "07",
    title: "Limitation of Liability",
    body: (
      <p>
        To the fullest extent permitted by law, kanek shall not be liable for
        any indirect, incidental, special, consequential, or punitive damages
        arising out of or related to your use of the App.
      </p>
    ),
  },
  {
    num: "08",
    title: "Intellectual Property",
    body: (
      <p>
        The kanek name, logo, and all content within the App are the property
        of kanek and are protected by applicable intellectual property laws.
      </p>
    ),
  },
  {
    num: "09",
    title: "Modifications",
    body: (
      <p>
        We reserve the right to modify these terms at any time. Continued use
        of the App after changes constitutes acceptance of the updated terms.
      </p>
    ),
  },
  {
    num: "10",
    title: "Governing Law",
    body: (
      <p>
        These terms shall be governed by and construed in accordance with the
        laws of Belize.
      </p>
    ),
  },
  {
    num: "11",
    title: "Contact",
    body: (
      <p>
        For questions about these terms, contact us at{" "}
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

export default function TermsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-28 sm:py-36">
        <div className="pointer-events-none absolute -top-40 right-1/4 h-125 w-125 rounded-full bg-accent-blue/5 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-100 w-100 rounded-full bg-accent-green/5 blur-[120px]" />

        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green">
            Legal
          </p>
          <h1 className="mt-6 font-heading text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
            Terms of Service
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Plain-language rules for using kanek. No surprises, no
            buried clauses — just fair terms for our community.
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
            Questions about these terms?{" "}
            <a
              href="mailto:support@kanek.bz"
              className="font-medium text-accent-green underline underline-offset-4 hover:text-accent-green/80 transition-colors"
            >
              Get in touch
            </a>
            . We&apos;re happy to explain anything.
          </p>
        </div>
      </section>
    </div>
  );
}
