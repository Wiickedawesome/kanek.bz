"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface BentoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
  index?: number;
}

export function BentoCard({
  title,
  description,
  icon,
  className = "",
  index = 0,
}: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        ease: "easeOut" as const,
      }}
      className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-accent-green/40 hover:shadow-[0_0_40px_-12px_rgba(81,193,82,0.3)] ${className}`}
    >
      {/* Animated gradient glow on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -inset-1 bg-gradient-to-br from-accent-green/10 via-transparent to-accent-blue/10" />
      </div>

      <div className="relative">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-green/15 to-accent-green/5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
          {icon}
        </div>
        <h3 className="font-heading text-xl font-bold sm:text-2xl">{title}</h3>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = "" }: BentoGridProps) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {children}
    </div>
  );
}
