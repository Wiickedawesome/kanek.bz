import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "kanek terms of service — the rules for using our community mobility board.",
};

const sections = [
  {
    num: "01",
    title: "What Kanek Is",
    body: (
      <p>
        kanek is a community mobility board for Belize. Users can post and
        discover rides, routes, errands, deliveries, and jobs. kanek is a
        platform, not a carrier, employer, dispatch service, broker, or
        ride-hailing company. We do not assign drivers, guarantee availability,
        or control the real-world conduct of users.
      </p>
    ),
  },
  {
    num: "02",
    title: "Eligibility and Verification",
    body: (
      <p>
        You must be at least 18 years old and legally able to enter binding
        agreements to use kanek. By using the app or site, you represent that
        the information you provide is accurate and current. Driver-facing
        features may require ID review, driver documents, vehicle information,
        and other trust-and-safety checks.
      </p>
    ),
  },
  {
    num: "03",
    title: "Account Responsibilities",
    body: (
      <ul className="space-y-3">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>Keep your profile, payment, and contact information accurate.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>Keep your phone number current because it is part of account access and verification.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>Protect your device and account credentials.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>Do not share your account or allow someone else to use it.</span>
        </li>
      </ul>
    ),
  },
  {
    num: "04",
    title: "Posts, Bookings, and Messages",
    body: (
      <p>
        You are responsible for keeping your posts, pricing, routing,
        availability, and communications truthful and up to date. Messages,
        live tracking, check-ins, and ratings exist to help users coordinate,
        but they do not make kanek a party to the underlying real-world
        arrangement.
      </p>
    ),
  },
  {
    num: "05",
    title: "Payments and Fees",
    body: (
      <>
        <p className="mb-3">
          kanek supports cash transactions and, where offered, E-Kyash digital
          payments in Belizean Dollars (BZD).
        </p>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            <span>A 3% platform fee on E-Kyash transactions helps run kanek and support the community.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            <span>Optional community donations may also be added.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            <span>Receipts, refunds, and transaction-status records may be created and stored.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            <span>Cash arrangements remain the responsibility of the users involved.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    num: "06",
    title: "Safety, Tracking, and SOS",
    body: (
      <p>
        kanek includes live tracking, selfie check-ins, ratings, reporting
        tools, and an SOS feature to support safer coordination. These features
        are assistance tools only. They do not guarantee identity, conduct,
        punctuality, performance, or emergency response. You remain responsible
        for using judgment, verifying details, and contacting local emergency
        services when necessary.
      </p>
    ),
  },
  {
    num: "07",
    title: "Prohibited Conduct",
    body: (
      <ul className="space-y-3">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>Do not post false, misleading, illegal, or fraudulent content.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>Do not harass, threaten, exploit, or discriminate against others.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>Do not misuse messaging, ratings, flags, check-ins, or safety tools.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>Do not create fake or duplicate accounts, scrape the platform, or interfere with the service.</span>
        </li>
      </ul>
    ),
  },
  {
    num: "08",
    title: "Ratings, Flags, and Strikes",
    body: (
      <p>
        kanek may allow users to rate one another, report content, and flag
        misconduct. We may investigate reports and apply warnings, soft
        strikes, hard strikes, restrictions, suspensions, or removals. Abuse of
        the rating or flagging system is itself a violation of these Terms.
      </p>
    ),
  },
  {
    num: "09",
    title: "Content and Intellectual Property",
    body: (
      <p>
        You keep ownership of content you submit, but you grant kanek a
        non-exclusive license to host, display, store, moderate, and distribute
        that content inside the product and related service surfaces. kanek and
        its branding, software, and original materials remain our property or
        the property of our licensors.
      </p>
    ),
  },
  {
    num: "10",
    title: "Limitation of Liability",
    body: (
      <p>
        kanek is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
        basis. To the maximum extent permitted by law, we disclaim warranties
        and are not liable for user conduct, off-platform agreements, failed or
        delayed payments, inaccurate listings, lost opportunities, service
        interruptions, or indirect, incidental, special, consequential, or
        punitive damages arising from your use of the platform.
      </p>
    ),
  },
  {
    num: "11",
    title: "Termination and Account Deletion",
    body: (
      <p>
        You may stop using kanek at any time and may request account deletion
        through the tools we provide. We may suspend, limit, or terminate
        access where we believe it is necessary for safety, fraud prevention,
        legal compliance, or Terms enforcement. Some data may remain in backup,
        audit, payment, or safety systems for the retention periods described
        in our Privacy Policy.
      </p>
    ),
  },
  {
    num: "12",
    title: "Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of Belize. Any dispute arising
        from these Terms or your use of kanek will be handled in the courts of
        Belize unless applicable law requires otherwise.
      </p>
    ),
  },
  {
    num: "13",
    title: "Changes to These Terms",
    body: (
      <p>
        We may update these Terms from time to time. When we do, we may revise
        the last-updated date and provide notice in the app or on the site when
        appropriate. Continued use of kanek after the updated Terms take effect
        means you accept the revised Terms.
      </p>
    ),
  },
  {
    num: "14",
    title: "Contact",
    body: (
      <p>
        For questions about these terms, contact us at{" "}
        <a
          href="mailto:support@belizechain.org"
          className="font-medium text-accent-green underline underline-offset-4 hover:text-accent-green/80 transition-colors"
        >
          support@belizechain.org
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
            The real operating rules for kanek as it exists. Clear limits,
            fair expectations, and no pretending we do more than the board
            actually does.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green" />
              Last updated: April 27, 2026
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
              href="mailto:support@belizechain.org"
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
