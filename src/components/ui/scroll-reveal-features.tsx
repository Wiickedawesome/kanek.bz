"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface FeatureData {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureCardProps {
  feature: FeatureData;
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.8, 1, 1, 0.8]);

  const number = String(index + 1).padStart(2, "0");
  const Icon = feature.icon;

  return (
    <motion.div ref={cardRef} style={{ opacity, y, scale }} className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{
          duration: 0.6,
          delay: index * 0.1,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        className="group relative overflow-hidden rounded-2xl border border-accent-green/20 bg-card p-8 shadow-xl transition-all duration-300 hover:border-accent-green/40"
      >
        {/* Glow effect */}
        <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-accent-green/20 to-neon-green/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

        {/* Animated border gradient */}
        <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-accent-green/0 via-accent-green/20 to-accent-green/0" />
        </div>

        {/* Big editorial number */}
        <div className="absolute right-4 top-4 select-none text-[120px] font-bold leading-none text-accent-green/5">
          {number}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon with glow */}
          <motion.div
            whileHover={{
              rotate: [0, -10, 10, -10, 0],
              transition: { duration: 0.5 },
            }}
            className="mb-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-accent-green/10 to-neon-green/10 p-4 text-accent-green shadow-lg shadow-accent-green/20"
          >
            <Icon className="h-12 w-12" />
          </motion.div>

          {/* Number badge */}
          <div className="mb-4 inline-block rounded-full border border-accent-green/20 bg-accent-green/10 px-4 py-1 font-mono text-sm font-semibold text-accent-green">
            {number}
          </div>

          {/* Title */}
          <h3 className="mb-3 font-heading text-2xl font-bold transition-colors duration-300 group-hover:text-accent-green">
            {feature.title}
          </h3>

          {/* Description */}
          <p className="leading-relaxed text-muted-foreground">
            {feature.description}
          </p>

          {/* Decorative line */}
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
            className="mt-6 h-px bg-gradient-to-r from-accent-green/50 via-accent-green/20 to-transparent"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ScrollRevealFeaturesProps {
  features: FeatureData[];
  heading?: React.ReactNode;
  className?: string;
}

export function ScrollRevealFeatures({
  features,
  heading,
  className,
}: ScrollRevealFeaturesProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {heading}
      <div className="mx-auto max-w-4xl space-y-8">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </div>
  );
}
