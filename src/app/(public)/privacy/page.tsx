import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "kanek privacy policy — what we collect, how we use it, and when we share it.",
};

const sections = [
  {
    num: "01",
    title: "Overview",
    body: (
      <p>
        Kanek is a community mobility board for Belize. This policy explains
        what information we collect through the app and related site pages, how
        we use it, and when we share it.
      </p>
    ),
  },
  {
    num: "02",
    title: "Information We Collect",
    body: (
      <ul className="space-y-3">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Account and profile information such as your phone number, name,
            email address, district, role, and profile photo.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Verification information such as ID images, driver documents,
            vehicle details, and selfie check-ins with GPS where required.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Activity data including posts, bookings, contracts, ratings,
            messages, reports, flags, and other interactions with the board.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Payment records such as E-Kyash invoice references, receipts,
            refund records, platform fees, and optional donations.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Location, device, push-token, diagnostics, and bot-protection data
            used to power maps, notifications, sign-in protection, and support.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Optional emergency contact details provided for the SOS feature.
          </span>
        </li>
      </ul>
    ),
  },
  {
    num: "03",
    title: "How We Use Your Information",
    body: (
      <ul className="space-y-3">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            To create and secure accounts, including phone OTP sign-in and
            bot-protection checks.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            To publish posts, manage bookings and contracts, and enable
            messaging, tracking, and trip coordination.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            To review verification information, enforce trust and safety rules,
            and investigate reports, flags, or disputes.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            To process E-Kyash payments, receipts, refunds, and donation
            tracking when digital payments are used.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            To deliver notifications, SOS alerts, maps, support, and product
            reliability monitoring.
          </span>
        </li>
      </ul>
    ),
  },
  {
    num: "04",
    title: "When We Share Information",
    body: (
      <ul className="space-y-3">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            With other Kanek users when needed to operate a post, booking,
            contract, message thread, check-in, rating, or active trip.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            With service providers that help us run the platform, including
            Supabase, Mapbox, Expo or mobile push providers, Resend, hCaptcha,
            Sentry, Twilio if SOS SMS is enabled, and E-Kyash.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            With administrators, regulators, law enforcement, or emergency
            contacts where necessary for safety, fraud prevention, legal
            compliance, or enforcement of our rules.
          </span>
        </li>
      </ul>
    ),
  },
  {
    num: "05",
    title: "Location, Messages, and Safety Features",
    body: (
      <ul className="space-y-3">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Browsing and posting can use location to show nearby routes,
            errands, deliveries, jobs, and map results within Belize.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Active trips may use precise and, for drivers, background location
            for live tracking between trip participants.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Driver selfie check-ins store a photo, timestamp, and GPS
            coordinates for the relevant contract.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
          <span>
            Contract messages are stored so participants can coordinate in the
            app, and SOS can send your location to the emergency contact you
            provide.
          </span>
        </li>
      </ul>
    ),
  },
  {
    num: "06",
    title: "Data Retention and Deletion",
    body: (
      <p>
        Active account information is retained while your account remains
        active. Posts, receipts, messages, check-ins, and safety records may be
        retained as long as needed to operate the service, resolve disputes,
        enforce rules, or meet legal obligations. If you delete your account,
        we soft-delete and anonymize core profile data, allow a recovery window
        of up to 90 days, and may permanently purge deleted accounts after that
        recovery window. Full cleanup can extend up to one year where retention
        is required for system integrity, fraud prevention, or legal
        compliance. For deletion questions, contact{" "}
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
  {
    num: "07",
    title: "Security",
    body: (
      <p>
        We use encrypted transport, access controls, restricted storage,
        row-level security policies, and operational monitoring to protect the
        data we hold. No service can guarantee absolute security, so you should
        also protect your own device and account access.
      </p>
    ),
  },
  {
    num: "08",
    title: "Children's Privacy",
    body: (
      <p>
        kanek is not intended for users under 18 years of age. We do not
        knowingly collect personal information from children.
      </p>
    ),
  },
  {
    num: "09",
    title: "Changes to This Policy",
    body: (
      <p>
        We may update this policy from time to time. When changes are material,
        we may update the in-app or web notice and revise the last-updated
        date.
      </p>
    ),
  },
  {
    num: "10",
    title: "Contact Us",
    body: (
      <p>
        If you have questions about this privacy policy, contact us at{" "}
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
            The privacy rules that match how kanek actually works.
            Straight answers, clear boundaries, and no fake promises.
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
            Have concerns?{" "}
            <a
              href="mailto:support@belizechain.org"
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
