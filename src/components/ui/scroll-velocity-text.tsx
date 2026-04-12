"use client";

import { type ReactNode, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useMotionValue,
} from "framer-motion";

interface ScrollVelocityTextProps {
  children: ReactNode;
  className?: string;
  baseVelocity?: number;
}

export function ScrollVelocityText({
  children,
  className = "",
  baseVelocity = 2,
}: ScrollVelocityTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const directionVal = useMotionValue(1);

  const { scrollY } = useScroll();
  const scrollVelocity = useSpring(0, { damping: 50, stiffness: 400 });

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? latest;
    const diff = latest - prev;
    directionVal.set(diff > 0 ? 1 : -1);
    scrollVelocity.set(diff);
  });

  const x = useTransform(
    [scrollVelocity, directionVal],
    ([vel, dir]: number[]) => {
      const range = baseVelocity * 80;
      const clamped = Math.max(-300, Math.min(300, vel));
      return (clamped / 300) * range * dir;
    }
  );

  const springX = useSpring(x, { damping: 60, stiffness: 300 });

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div style={{ x: springX }} className={className}>
        {children}
      </motion.div>
    </div>
  );
}
