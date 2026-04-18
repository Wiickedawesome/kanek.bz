"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTheme } from "next-themes";
import {
  MapPin,
  Package,
  ShoppingBag,
  Briefcase,
  Shield,
  Radio,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";
import { ScrollRevealFeatures } from "@/components/ui/scroll-reveal-features";
import { ScrollVelocityText } from "@/components/ui/scroll-velocity-text";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AuroraBlobs } from "@/components/ui/aurora-blobs";
import { MagneticButton } from "@/components/ui/magnetic-button";

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

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  return (
    <div>
      {/* ─── Hero — full-bleed dark with particle text ─── */}
      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden bg-[#f6f6f4] dark:bg-forest-900"
      >
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-32 left-1/4 h-125 w-125 rounded-full bg-accent-green/8 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-100 w-100 rounded-full bg-accent-blue/8 blur-[100px]" />

        {/* Particle canvas as full background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <ParticleTextEffect
            words={["kanek", "RIDES", "DELIVER", "KANEK", "BELIZE"]}
            className="h-full w-full"
            theme={resolvedTheme ?? "dark"}
          />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative flex min-h-screen flex-col items-center justify-end px-4 pb-28"
        >
          <h1 className="sr-only">kanek — Community Mobility Board for Belize</h1>
          {/* Tagline below particles */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" as const }}
            className="max-w-2xl text-center text-xl font-light tracking-wide text-forest-900/70 dark:text-white/70 sm:text-2xl"
          >
            A community mobility board for Belize.
            <br />
            <span className="text-accent-green dark:text-neon-green font-medium">
              People helping people move.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7, ease: "easeOut" as const }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Button
              render={<Link href="/download" />}
              size="lg"
              className="bg-neon-green hover:bg-neon-green/90 text-forest-900 font-bold px-10 py-6 text-lg"
            >
              Get the App
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              render={<Link href="/about" />}
              variant="outline"
              size="lg"
              className="border-forest-900/20 text-forest-900 hover:bg-forest-900/10 dark:border-white/20 dark:text-white dark:hover:bg-white/10 px-10 py-6 text-lg"
            >
              Learn More
            </Button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-10"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" as const }}
            >
              <ArrowDown className="h-6 w-6 text-white/30" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Manifesto — scroll-velocity text ─── */}
      <section className="relative overflow-hidden bg-background py-28">
        <AuroraBlobs />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 space-y-4">
          <ScrollVelocityText baseVelocity={1}>
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl"
            >
              No corporate fleet.
            </motion.p>
          </ScrollVelocityText>
          <ScrollVelocityText baseVelocity={1.5}>
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-accent-green sm:text-5xl md:text-6xl"
            >
              No surge pricing.
            </motion.p>
          </ScrollVelocityText>
          <ScrollVelocityText baseVelocity={2}>
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl"
            >
              Just your neighbors.
            </motion.p>
          </ScrollVelocityText>
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="max-w-2xl pt-4 text-lg text-muted-foreground sm:text-xl"
          >
            kanek is a board — not an app telling you what to do. Post rides,
            deliveries, errands, and jobs. Or pick one up. The community
            decides.
          </motion.p>
        </div>
      </section>

      {/* ─── Features — Scroll-Reveal Cards ─── */}
      <section className="py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollRevealFeatures
            features={features}
            heading={
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" as const }}
                className="mb-12 font-heading text-3xl font-bold tracking-tight sm:text-4xl"
              >
                One board. Everything moves.
              </motion.h2>
            }
          />
        </div>
      </section>

      {/* ─── Stats — animated counters ─── */}
      <section className="border-y border-border/50 bg-background py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 text-center sm:px-6 lg:grid-cols-4">
          {[
            { to: 6, suffix: "", label: "Districts connected" },
            { to: 0, suffix: "%", label: "Surge pricing" },
            { to: 100, suffix: "%", label: "Community-owned" },
            { to: 24, suffix: "/7", label: "Availability" },
          ].map((stat) => (
            <div key={stat.label}>
              <AnimatedCounter
                to={stat.to}
                suffix={stat.suffix}
                className="font-heading text-5xl font-black text-accent-green sm:text-6xl"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works + CTA — single dark block ─── */}
      <section className="relative overflow-hidden bg-forest-900 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(81,193,82,0.1),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(101,246,123,0.12),transparent_50%)]" />

        {/* How it works */}
        <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Three steps. That&apos;s it.
          </motion.h2>

          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Post or browse",
                desc: "Need a ride? Sending a package? Post it on the board or browse what's available nearby.",
              },
              {
                num: "02",
                title: "Connect",
                desc: "Match with a verified community member heading your way. Chat and confirm the details.",
              },
              {
                num: "03",
                title: "Move",
                desc: "Track in real-time, arrive safe, leave a review. Community trust grows with every trip.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.2,
                  duration: 0.7,
                  ease: "easeOut" as const,
                }}
              >
                <span className="block font-heading text-8xl font-black text-neon-green/20 sm:text-9xl">
                  {step.num}
                </span>
                <h3 className="-mt-4 font-heading text-2xl font-bold">
                  {step.title}
                </h3>
                <p className="mt-3 text-white/60">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="relative mx-auto max-w-3xl px-4 pt-16 pb-28 text-center sm:px-6">
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
            className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl"
          >
            Ready to move?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-4 text-lg text-white/60"
          >
            Download kanek and join a growing community of Belizeans helping each
            other get from A to B.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" as const }}
            className="mt-10"
          >
            <MagneticButton className="inline-block">
              <Button
                render={<Link href="/download" />}
                size="lg"
                className="bg-neon-green hover:bg-neon-green/90 text-forest-900 font-bold text-lg px-12 py-6"
              >
                Get kanek Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </MagneticButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
