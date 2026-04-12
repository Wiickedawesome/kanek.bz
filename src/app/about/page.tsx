"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollVelocityText } from "@/components/ui/scroll-velocity-text";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AuroraBlobs } from "@/components/ui/aurora-blobs";
import { MagneticButton } from "@/components/ui/magnetic-button";

/* ── animation helpers ── */
const charReveal = {
  hidden: { opacity: 0, y: 80, rotateX: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function SplitHeading({
  lines,
  accentIndex,
}: {
  lines: string[];
  accentIndex?: number;
}) {
  let charCount = 0;
  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      className="mt-8 font-heading text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-tighter"
      style={{ perspective: 600 }}
    >
      {lines.map((line, li) => (
        <span key={li} className="block overflow-hidden">
          {line.split("").map((ch) => {
            const idx = charCount++;
            return (
              <motion.span
                key={idx}
                custom={idx}
                variants={charReveal}
                className={`inline-block ${li === accentIndex ? "text-accent-green" : ""}`}
                style={{ whiteSpace: ch === " " ? "pre" : undefined }}
              >
                {ch}
              </motion.span>
            );
          })}
        </span>
      ))}
    </motion.h1>
  );
}

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroBlur = useTransform(scrollYProgress, [0, 0.8, 1], [0, 0, 8]);
  const heroFilter = useTransform(heroBlur, (v) => `blur(${v}px)`);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <div>
      {/* ─── Hero — immersive full-bleed ─── */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center overflow-hidden bg-forest-900 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(81,193,82,0.12),_transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(73,103,246,0.08),_transparent_50%)]" />

        <motion.div style={{ y: heroY, filter: heroFilter, scale: heroScale }} className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-green"
          >
            The story
          </motion.p>

          <SplitHeading
            lines={["400,000", "people.", "Zero", "ride-share."]}
            accentIndex={1}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 max-w-lg text-lg leading-relaxed text-white/50"
          >
            Belize has six districts, one highway, and no app to get you from
            one to the other. Until now.
          </motion.p>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" as const }}
            className="relative h-10 w-6 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4], boxShadow: ["0 0 4px #65f67b", "0 0 12px #65f67b", "0 0 4px #65f67b"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" as const }}
              className="h-2 w-1 rounded-full bg-neon-green"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── The Problem — raw, editorial ─── */}
      <section className="relative overflow-hidden py-32 sm:py-44">
        <AuroraBlobs />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <ScrollVelocityText baseVelocity={1}>
            <p className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tight">
              No bus after 6 PM.
            </p>
          </ScrollVelocityText>
          <ScrollVelocityText baseVelocity={1.5}>
            <p className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tight text-accent-green">
              Hitchhiking is the backup plan.
            </p>
          </ScrollVelocityText>
          <ScrollVelocityText baseVelocity={0.8}>
            <p className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tight">
              Packages cost more than what&apos;s inside.
            </p>
          </ScrollVelocityText>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 max-w-2xl text-xl leading-relaxed text-muted-foreground"
          >
            Drivers cross the country every day with empty seats. Freelancers
            search for gigs by word of mouth. Nobody&apos;s connected any of it.
          </motion.p>
        </div>
      </section>

      {/* ─── The Answer — big type, no fluff ─── */}
      <section className="bg-forest-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-44">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" as const }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.5, rotate: -12 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block font-heading text-[10rem] font-black leading-none text-neon-green/10 select-none sm:text-[14rem]"
              >
                &ldquo;
              </motion.span>
              <h2 className="-mt-24 font-heading text-4xl font-extrabold leading-tight tracking-tight sm:-mt-32 sm:text-5xl md:text-6xl">
                A board.
                <br />
                Not an app
                <br />
                <span className="text-neon-green">telling you what to do.</span>
              </h2>
            </motion.div>

            <div className="flex flex-col justify-center space-y-8">
              {[
                "Post a ride, a delivery, an errand, or a job.",
                "Anyone heading that direction picks it up.",
                "No fleet. No algorithms deciding your fare.",
                "Just people who know these roads helping each other move.",
              ].map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: 60, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.15 * i, ease: "easeOut" as const }}
                  className="text-xl leading-relaxed text-white/60 sm:text-2xl"
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <section className="border-y border-border/50 bg-background py-20 overflow-hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10 px-4 text-center sm:px-6 lg:grid-cols-4">
          {[
            { to: 6, suffix: "", label: "Districts" },
            { to: 400, suffix: "K+", label: "Population" },
            { to: 0, suffix: "", label: "Ride-share apps" },
            { to: 1, suffix: "", label: "kanek" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.12 * i,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <AnimatedCounter
                to={stat.to}
                suffix={stat.suffix}
                className="font-heading text-5xl font-black text-accent-green sm:text-6xl"
              />
              <p className="mt-2 text-sm tracking-wide text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Origin — editorial timeline, not numbered cards ─── */}
      <section className="py-32 sm:py-44">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-green"
          >
            How we got here
          </motion.p>

          <div className="mt-20 space-y-32">
            {/* Beat 1 */}
            <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
              <motion.span
                initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="self-start font-heading text-[8rem] font-black leading-none text-accent-green/10 sm:text-[10rem]"
              >
                01
              </motion.span>
              <motion.div
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="self-center"
              >
                <h3 className="font-heading text-3xl font-bold sm:text-4xl">
                  The question everyone asks
                </h3>
                <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
                  &ldquo;How do I get from here to there?&rdquo; If you
                  don&apos;t own a car in Belize, this question defines your
                  day. Buses run limited routes with no night service. Taxis are
                  expensive. Most people figure it out through WhatsApp groups
                  and sheer luck.
                </p>
              </motion.div>
            </div>

            {/* Beat 2 */}
            <div className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="self-center"
              >
                <h3 className="font-heading text-3xl font-bold sm:text-4xl">
                  Empty seats, full roads
                </h3>
                <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
                  Thousands of drivers cross the country daily with 3 or 4 empty
                  seats. Freelancers hunt for gigs by word of mouth. Packages
                  move through informal networks with zero accountability. All
                  this capacity — wasted.
                </p>
              </motion.div>
              <motion.span
                initial={{ opacity: 0, scale: 0.5, rotate: 8 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="self-start text-right font-heading text-[8rem] font-black leading-none text-accent-green/10 sm:text-[10rem]"
              >
                02
              </motion.span>
            </div>

            {/* Beat 3 */}
            <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
              <motion.span
                initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="self-start font-heading text-[8rem] font-black leading-none text-accent-green/10 sm:text-[10rem]"
              >
                03
              </motion.span>
              <motion.div
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="self-center"
              >
                <h3 className="font-heading text-3xl font-bold sm:text-4xl">
                  So we built the board
                </h3>
                <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
                  kanek connects all of it — rides, deliveries, errands, and
                  jobs on a single community board. Free to use, built for how
                  Belize actually works. No venture capital. No algorithm
                  deciding your fare. Just neighbors solving a problem together.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Beliefs — stark, no icons ─── */}
      <section className="bg-forest-900 text-white py-32 sm:py-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(101,246,123,0.04),_transparent_70%)]" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-neon-green"
          >
            What we believe
          </motion.p>

          <div className="mt-20 grid gap-px bg-white/10 sm:grid-cols-2">
            {[
              {
                title: "Community first",
                text: "kanek isn't a corporation — it's a tool the community owns. Every feature exists because Belizeans asked for it.",
              },
              {
                title: "Made in Belize",
                text: "Built by people who know these roads, this culture, and the real distances between districts.",
              },
              {
                title: "Trust is earned",
                text: "Verified profiles, real ratings, live tracking. Safety isn't a feature — it's the foundation.",
              },
              {
                title: "No middleman",
                text: "Drivers and riders connect directly. No corporate cut. No surge. The price is between you and your neighbor.",
              },
            ].map((belief, i) => (
              <motion.div
                key={belief.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.03, backgroundColor: "rgba(101,246,123,0.06)" }}
                className="bg-forest-900 p-10 sm:p-14 transition-colors duration-300 cursor-default"
              >
                <motion.h3
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 + 0.2 }}
                  className="font-heading text-2xl font-bold sm:text-3xl"
                >
                  {belief.title}
                </motion.h3>
                <p className="mt-4 text-lg leading-relaxed text-white/50">
                  {belief.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Closing CTA ─── */}
      <section className="relative overflow-hidden py-32 sm:py-44">
        <AuroraBlobs />
        {/* pulsing glow ring */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" as const }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full border border-accent-green/20 blur-sm"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-5xl font-black tracking-tight sm:text-6xl md:text-7xl"
          >
            Built for Belize.
            <br />
            <span className="text-accent-green">By Belizeans.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mx-auto mt-8 max-w-xl text-xl text-muted-foreground"
          >
            Every road, every route, every district — we know this country
            because we live here.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" as const }}
            className="mt-12"
          >
            <MagneticButton className="inline-block">
              <Button
                render={<Link href="/download" />}
                size="lg"
                className="bg-accent-green hover:bg-accent-green/90 text-white font-bold text-lg px-12 py-6"
              >
                Get kanek
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </MagneticButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
