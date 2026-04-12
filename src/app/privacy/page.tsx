import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "kanek privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
      <h1>Privacy Policy</h1>
      <p className="lead">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        When you create a kanek account we collect your name, email address,
        phone number, and profile photo. When you post or accept a ride,
        delivery, errand, or job, we collect location data necessary to provide
        the service.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide, maintain, and improve kanek services.</li>
        <li>To connect riders, drivers, senders, and helpers.</li>
        <li>To verify your identity and maintain trust &amp; safety.</li>
        <li>To send service-related notifications.</li>
        <li>To comply with applicable laws and regulations.</li>
      </ul>

      <h2>3. Location Data</h2>
      <p>
        We collect location data only while you are actively using the app to
        post, browse, or fulfill a request. You can revoke location permissions
        at any time through your device settings.
      </p>

      <h2>4. Data Sharing</h2>
      <p>
        We do not sell your personal data. We share limited information with
        other kanek users only as necessary to facilitate a connection (e.g.
        your first name and approximate pickup location with a matched driver).
      </p>

      <h2>5. Data Security</h2>
      <p>
        We use industry-standard encryption and security practices to protect
        your data. All communication between the app and our servers is
        encrypted via TLS.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        We retain your account data for as long as your account is active. You
        may request deletion of your account and associated data at any time by
        contacting <a href="mailto:support@kanek.bz">support@kanek.bz</a>.
      </p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>
        kanek is not intended for users under 18 years of age. We do not
        knowingly collect personal information from children.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. We will notify you of
        material changes through the app or by email.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        If you have questions about this privacy policy, contact us at{" "}
        <a href="mailto:support@kanek.bz">support@kanek.bz</a>.
      </p>
    </article>
  );
}
