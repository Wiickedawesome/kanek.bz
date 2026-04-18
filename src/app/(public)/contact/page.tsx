"use client";

import { motion } from "framer-motion";
import { Mail, MessageSquare, MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

const slideIn = (direction: "left" | "right") => ({
  hidden: { opacity: 0, x: direction === "left" ? -80 : 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" as const },
  },
});

const faqs = [
  {
    q: "Is kanek free?",
    a: "Yes — 100% free to download and use. No subscriptions, no hidden fees.",
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

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(!open);
        }
      }}
      className="w-full text-left border-b border-border/40 py-6 group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-heading text-lg font-semibold sm:text-xl">
          {q}
        </h3>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="overflow-hidden"
      >
        <p className="pt-3 text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div>
      {/* ─── Hero — dramatic ─── */}
      <section className="relative overflow-hidden py-32 sm:py-44">
        <div className="pointer-events-none absolute -top-32 right-1/4 h-125 w-125 rounded-full bg-accent-blue/6 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-100 w-100 rounded-full bg-accent-green/6 blur-[100px]" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green"
            >
              Contact
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-6 font-heading text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl"
            >
              Let&apos;s <span className="text-accent-green">talk.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl"
            >
              Have a question, idea, or just want to say hi? We&apos;re
              real people building for our community. We read every message.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─── Contact channels — big bold rows ─── */}
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
              value: "support@kanek.bz",
              href: "mailto:support@kanek.bz",
              desc: "Need help with the app? Report a bug or get assistance.",
            },
            {
              icon: MapPin,
              label: "Location",
              value: "Belize, Central America",
              href: undefined,
              desc: "Built with love from the Jewel.",
            },
          ].map((channel, i) => (
            <motion.div
              key={channel.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className={`flex flex-col gap-6 border-b border-border/40 py-14 md:flex-row md:items-center md:justify-between ${
                i === 2 ? "border-b-0" : ""
              }`}
            >
              <div className="flex items-start gap-6">
                <motion.div
                  variants={slideIn("left")}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-green/10"
                >
                  <channel.icon className="h-6 w-6 text-accent-green" />
                </motion.div>
                <motion.div variants={slideIn("left")}>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    {channel.label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {channel.desc}
                  </p>
                </motion.div>
              </div>

              <motion.div variants={slideIn("right")}>
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
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FAQ — interactive accordion ─── */}
      <section className="bg-muted/30 py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green"
            >
              FAQ
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl"
            >
              Common questions.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="mt-16"
          >
            {faqs.map((faq) => (
              <motion.div key={faq.q} variants={fadeUp}>
                <FaqItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Closing strip ─── */}
      <section className="relative overflow-hidden bg-forest-900 py-28 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(73,103,246,0.08),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl"
            >
              We&apos;re building this
              <br />
              <span className="text-neon-green">together.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-xl text-lg text-white/60"
            >
              kanek belongs to the community. Your feedback shapes what we build
              next. Don&apos;t be a stranger.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
