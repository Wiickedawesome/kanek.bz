"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTheme } from "next-themes";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";

export function HomeHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen overflow-hidden bg-[#f6f6f4] dark:bg-forest-900"
    >
      <div className="pointer-events-none absolute -top-32 left-1/4 h-125 w-125 rounded-full bg-accent-green/8 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-100 w-100 rounded-full bg-accent-blue/8 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0"
      >
        <ParticleTextEffect
          words={["kanek", "RIDES", "DELIVER", "ERRANDS", "JOBS", "KANEK", "BELIZE"]}
          className="h-full w-full"
          theme={resolvedTheme ?? "dark"}
        />
      </motion.div>

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex min-h-screen flex-col items-center justify-end px-4 pb-28"
      >
        <h1 className="sr-only">kanek — Community Mobility Board for Belize</h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl text-center"
        >
          <p className="text-lg leading-relaxed text-forest-900/70 dark:text-white/70 sm:text-xl">
            kanek is Belize&apos;s community board for rides, deliveries, errands,
            and jobs. People helping people move without surge pricing,
            dispatch games, or a corporate fleet in the middle.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7, ease: "easeOut" }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Button
            render={<Link href="/download" />}
            size="lg"
            className="bg-neon-green px-10 py-6 text-lg font-bold text-forest-900 hover:bg-neon-green/90"
          >
            Get the App
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            render={<Link href="/about" />}
            variant="outline"
            size="lg"
            className="border-forest-900/20 px-10 py-6 text-lg text-forest-900 hover:bg-forest-900/10 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
          >
            Learn More
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ArrowDown className="h-6 w-6 text-white/30" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}