"use client";

import { motion } from "framer-motion";

interface MarqueeProps {
  items: string[];
  speed?: number;
  separator?: string;
  className?: string;
}

export function Marquee({
  items,
  speed = 20,
  separator = "•",
  className = "",
}: MarqueeProps) {
  const text = items.join(` ${separator} `) + ` ${separator} `;
  // Duplicate for seamless loop
  const fullText = text + text;

  return (
    <div
      className={`overflow-hidden whitespace-nowrap ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="inline-block"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
      >
        <span className="inline-block pr-4">{fullText}</span>
      </motion.div>
    </div>
  );
}
