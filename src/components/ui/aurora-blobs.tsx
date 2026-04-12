"use client";

import { motion } from "framer-motion";

interface AuroraBlobsProps {
  className?: string;
}

export function AuroraBlobs({ className = "" }: AuroraBlobsProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="absolute -top-1/4 -left-1/4 h-150 w-150 rounded-full bg-accent-green/8 blur-[140px]"
        animate={{
          x: [0, 100, 0],
          y: [0, 60, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-125 w-125 rounded-full bg-accent-blue/8 blur-[120px]"
        animate={{
          x: [0, -80, 0],
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 h-87.5 w-87.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-green/5 blur-[100px]"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
      />
    </div>
  );
}
