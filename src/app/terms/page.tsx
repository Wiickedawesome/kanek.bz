import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "kanek terms of service — the rules for using our community mobility platform.",
};

export default function TermsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
      <h1>Terms of Service</h1>
      <p className="lead">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By downloading, installing, or using the kanek mobile application
        (&ldquo;the App&rdquo;), you agree to be bound by these Terms of
        Service. If you do not agree, do not use the App.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        kanek is a community mobility board that allows users in Belize to post
        and accept rides, package deliveries, errands, and jobs. kanek is a
        platform — we do not provide transportation or delivery services
        directly.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be at least 18 years old and legally able to enter into
        agreements to use kanek. By using the App, you represent and warrant
        that you meet these requirements.
      </p>

      <h2>4. User Accounts</h2>
      <ul>
        <li>You are responsible for maintaining the security of your account.</li>
        <li>You agree to provide accurate and complete information.</li>
        <li>You may not create multiple accounts or impersonate others.</li>
        <li>
          We reserve the right to suspend or terminate accounts that violate
          these terms.
        </li>
      </ul>

      <h2>5. User Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the App for any unlawful purpose.</li>
        <li>Harass, threaten, or discriminate against other users.</li>
        <li>Post false, misleading, or fraudulent content.</li>
        <li>Attempt to access other users&apos; accounts or data.</li>
        <li>Interfere with the operation of the App.</li>
      </ul>

      <h2>6. Community Transactions</h2>
      <p>
        All arrangements made through kanek (rides, deliveries, errands, jobs)
        are between the participating users. kanek is not a party to these
        transactions and is not responsible for the quality, safety, or legality
        of the services exchanged.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, kanek shall not be liable for
        any indirect, incidental, special, consequential, or punitive damages
        arising out of or related to your use of the App.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        The kanek name, logo, and all content within the App are the property
        of kanek and are protected by applicable intellectual property laws.
      </p>

      <h2>9. Modifications</h2>
      <p>
        We reserve the right to modify these terms at any time. Continued use
        of the App after changes constitutes acceptance of the updated terms.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These terms shall be governed by and construed in accordance with the
        laws of Belize.
      </p>

      <h2>11. Contact</h2>
      <p>
        For questions about these terms, contact us at{" "}
        <a href="mailto:support@kanek.bz">support@kanek.bz</a>.
      </p>
    </article>
  );
}
