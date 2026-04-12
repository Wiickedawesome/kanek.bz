"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Apple, Play, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollVelocityText } from "@/components/ui/scroll-velocity-text";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AuroraBlobs } from "@/components/ui/aurora-blobs";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function DownloadPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <>
      {/* ─── Hero — immersive full-bleed ─── */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center overflow-hidden bg-forest-900 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,_rgba(81,193,82,0.12),_transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,_rgba(73,103,246,0.08),_transparent_50%)]" />

        <motion.div style={{ y: heroY }} className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-green"
          >
            Get the app
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" as const }}
            className="mt-8 font-heading text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-tighter"
          >
            Your
            <br />
            community,
            <br />
            <span className="text-neon-green">in your pocket.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 max-w-lg text-lg leading-relaxed text-white/50"
          >
            Post rides, deliveries, errands, and jobs — or pick one up from
            your neighbors. All from your phone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" as const }}
            className="mt-12 flex flex-col gap-4 sm:flex-row"
          >
            <Button
              render={<a href="#" aria-label="Download on the App Store" />}
              size="lg"
              className="bg-white hover:bg-white/90 text-forest-900 font-bold px-8 py-6 text-lg"
            >
              <Apple className="mr-2 h-5 w-5" />
              App Store
            </Button>
            <Button
              render={<a href="#" aria-label="Get it on Google Play" />}
              size="lg"
              className="bg-white hover:bg-white/90 text-forest-900 font-bold px-8 py-6 text-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Google Play
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-6 text-sm text-white/30"
          >
            Coming soon to app stores. Join the waitlist below.
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
            className="h-10 w-6 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
          >
            <div className="h-2 w-1 rounded-full bg-neon-green" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── What moves — scroll velocity ─── */}
      <section className="relative overflow-hidden py-32 sm:py-44">
        <AuroraBlobs />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 space-y-4">
          <ScrollVelocityText baseVelocity={1}>
            <p className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tight">
              Rides across districts.
            </p>
          </ScrollVelocityText>
          <ScrollVelocityText baseVelocity={1.5}>
            <p className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tight text-accent-green">
              Packages door to door.
            </p>
          </ScrollVelocityText>
          <ScrollVelocityText baseVelocity={0.8}>
            <p className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tight">
              Errands handled. Jobs posted.
            </p>
          </ScrollVelocityText>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 max-w-2xl text-xl leading-relaxed text-muted-foreground"
          >
            One app. Four powers. Everything your community needs to keep
            moving — in your pocket.
          </motion.p>
        </div>
      </section>

      {/* ─── The four powers — editorial stagger ─── */}
      <section className="bg-forest-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-44">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-green"
          >
            One app, four powers
          </motion.p>

          <div className="mt-20 space-y-28">
            {[
              {
                num: "01",
                title: "Rides",
                body: "Share your commute or catch a ride across districts. No fleet, no surge — just your neighbor heading the same way.",
              },
              {
                num: "02",
                title: "Deliveries",
                body: "Send packages with someone already heading that direction. Belize City to Dangriga, Orange Walk to Punta Gorda — it just moves.",
              },
              {
                num: "03",
                title: "Errands",
                body: "Groceries, pickups, drop-offs. Post what you need, someone nearby handles it. Neighbors got you.",
              },
              {
                num: "04",
                title: "Jobs",
                body: "Quick gigs and local opportunities, posted by your community. Find work or hire help — no middleman.",
              },
            ].map((item, i) => (
              <div
                key={item.num}
                className={`grid gap-8 lg:gap-16 ${
                  i % 2 === 0
                    ? "lg:grid-cols-[1fr_2fr]"
                    : "lg:grid-cols-[2fr_1fr]"
                }`}
              >
                {i % 2 === 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="self-start font-heading text-[8rem] font-black leading-none text-neon-green/10 select-none sm:text-[10rem]"
                  >
                    {item.num}
                  </motion.span>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                  className="self-center"
                >
                  <h3 className="font-heading text-3xl font-bold sm:text-4xl">
                    {item.title}
                  </h3>
                  <p className="mt-6 text-xl leading-relaxed text-white/60 sm:text-2xl">
                    {item.body}
                  </p>
                </motion.div>
                {i % 2 !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="self-start text-right font-heading text-[8rem] font-black leading-none text-neon-green/10 select-none sm:text-[10rem]"
                  >
                    {item.num}
                  </motion.span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── No strings — facts strip ─── */}
      <section className="border-y border-border/50 bg-background py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10 px-4 text-center sm:px-6 lg:grid-cols-4">
          {[
            { to: 0, suffix: "", label: "Cost to download" },
            { to: 0, suffix: "", label: "Subscriptions" },
            { to: 6, suffix: "", label: "Districts covered" },
            { to: 2, suffix: "", label: "Platforms" },
          ].map((stat) => (
            <div key={stat.label}>
              <AnimatedCounter
                to={stat.to}
                suffix={stat.suffix}
                className="font-heading text-5xl font-black text-accent-green sm:text-6xl"
              />
              <p className="mt-2 text-sm tracking-wide text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Built for everyone — 2x3 grid ─── */}
      <section className="py-32 sm:py-44">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
            className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl"
          >
            Built for everyone.
            <br />
            <span className="text-accent-green">No strings attached.</span>
          </motion.h2>

          <div className="mt-20 grid gap-px bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Free to download and use",
              "No subscription required",
              "Works on iOS and Android",
              "Available across all districts",
              "Real-time notifications",
              "Secure verified profiles",
            ].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.5,
                  ease: "easeOut" as const,
                }}
                className="bg-background p-10"
              >
                <span className="font-heading text-5xl font-black text-accent-green/15">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-4 text-lg font-medium">{feature}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA — final push ─── */}
      <section className="relative overflow-hidden bg-forest-900 py-32 text-white sm:py-44">
        <AuroraBlobs />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(101,246,123,0.08),_transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" as const }}
            className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-black tracking-tighter"
          >
            Ready to join
            <br />
            <span className="text-neon-green">the board?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-8 max-w-xl text-xl text-white/50"
          >
            Download kanek and start connecting with your community today.
            Free, forever.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              render={<a href="#" aria-label="Download on the App Store" />}
              size="lg"
              className="bg-neon-green hover:bg-neon-green/90 text-forest-900 font-bold px-10 py-6 text-lg"
            >
              <Apple className="mr-2 h-5 w-5" />
              App Store
            </Button>
            <Button
              render={<a href="#" aria-label="Get it on Google Play" />}
              size="lg"
              className="bg-neon-green hover:bg-neon-green/90 text-forest-900 font-bold px-10 py-6 text-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Google Play
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16"
          >
            <MagneticButton>
              <Button
                render={<Link href="/join" />}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-10 py-6 text-lg"
              >
                Join the Community
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </MagneticButton>
          </motion.div>
        </div>
      </section>
    </>
  );
}
