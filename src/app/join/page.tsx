"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Code,
  Megaphone,
  PenTool,
  Users,
  Heart,
  ArrowRight,
} from "lucide-react";

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

const roles = [
  {
    icon: Code,
    title: "Builders & Developers",
    description:
      "Write code, design systems, and help shape the platform. kanek is open to collaborators who want to build real technology for Belize.",
    color: "from-accent-green/20 to-accent-green/5",
  },
  {
    icon: Megaphone,
    title: "Community Ambassadors",
    description:
      "Spread the word in your district. Help onboard riders, drivers, and senders. Be the voice of kanek in your town.",
    color: "from-accent-blue/20 to-accent-blue/5",
  },
  {
    icon: PenTool,
    title: "Creatives & Storytellers",
    description:
      "Design, write, photograph, film — help tell the story of community mobility in Belize.",
    color: "from-neon-green/20 to-neon-green/5",
  },
  {
    icon: Users,
    title: "Local Partners",
    description:
      "Businesses, organizations, and community leaders who want to integrate kanek into their operations or support the movement.",
    color: "from-accent-green/20 to-accent-green/5",
  },
];

export default function JoinPage() {
  return (
    <>
      {/* ─── Hero — rallying cry ─── */}
      <section className="relative overflow-hidden py-32 sm:py-44">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-neon-green/6 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent-blue/6 blur-[100px]" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-green"
            >
              Join the movement
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-6 font-heading text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl"
            >
              Make Belize
              <br />
              <span className="text-accent-green">the best.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl"
            >
              kanek isn&apos;t a company looking for employees. It&apos;s a
              community looking for people who give a damn — builders,
              connectors, dreamers, doers. If you want to make a change, you
              belong here.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─── Why join — bold manifesto ─── */}
      <section className="relative overflow-hidden bg-forest-900 py-32 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(101,246,123,0.08),_transparent_60%)]" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="space-y-6"
          >
            <motion.p
              variants={fadeUp}
              className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl"
            >
              No investors.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-neon-green sm:text-5xl md:text-6xl"
            >
              No shareholders.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl"
            >
              Just people who care.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="max-w-2xl pt-4 text-lg text-white/60 sm:text-xl"
            >
              We&apos;re not building for Silicon Valley. We&apos;re building
              for Belize City, San Ignacio, Orange Walk, Dangriga, Punta Gorda,
              and Corozal. Every district, every road, every community.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─── Roles — alternating asymmetric ─── */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
              Where you fit
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl"
            >
              Find your role.
            </motion.h2>
          </motion.div>

          {roles.map((role, i) => {
            const isEven = i % 2 === 0;
            return (
              <motion.div
                key={role.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className={`flex flex-col items-center gap-8 py-16 md:flex-row ${
                  isEven ? "" : "md:flex-row-reverse"
                }`}
              >
                <motion.div
                  variants={slideIn(isEven ? "left" : "right")}
                  className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${role.color}`}
                >
                  <role.icon className="h-10 w-10 text-foreground" />
                </motion.div>

                <motion.div
                  variants={slideIn(isEven ? "right" : "left")}
                  className={`${isEven ? "md:text-left" : "md:text-right"} text-center`}
                >
                  <h3 className="font-heading text-2xl font-bold sm:text-3xl">
                    {role.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-lg text-muted-foreground">
                    {role.description}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── What you get — giant numbers ─── */}
      <section className="bg-muted/30 py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
              What you get
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl"
            >
              More than a title.
            </motion.h2>
          </motion.div>

          <div className="mt-20 grid gap-12 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Real impact",
                desc: "Your work directly improves how thousands of Belizeans move, send, and connect every day.",
              },
              {
                num: "02",
                title: "A network",
                desc: "Connect with builders, creators, and leaders across all six districts who share your vision.",
              },
              {
                num: "03",
                title: "Your name on it",
                desc: "This isn't charity work — it's legacy. Be part of building something Belize has never had.",
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
                <span className="block font-heading text-7xl font-black text-accent-green/15 sm:text-8xl">
                  {step.num}
                </span>
                <h3 className="-mt-4 font-heading text-2xl font-bold">
                  {step.title}
                </h3>
                <p className="mt-3 text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA — reach out ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-forest-900 via-forest-800 to-forest-900 py-28 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(101,246,123,0.06),_transparent_70%)]" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Heart className="mx-auto h-12 w-12 text-neon-green/60" />
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="mt-8 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl"
            >
              Ready to build something
              <br />
              <span className="text-neon-green">that matters?</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-xl text-lg text-white/60"
            >
              Drop us a line. Tell us who you are, what you&apos;re good at, and
              how you want to help. No résumé needed — just heart.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button
                render={<a href="mailto:hello@kanek.bz" />}
                size="lg"
                className="bg-neon-green hover:bg-neon-green/90 text-forest-900 font-bold text-base px-10 py-6 text-lg"
              >
                hello@kanek.bz
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                render={<Link href="/contact" />}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-10 py-6 text-lg"
              >
                Other ways to reach us
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
