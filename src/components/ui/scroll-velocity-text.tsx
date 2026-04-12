"use client";

import { type ReactNode, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
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
  const directionRef = useRef(1);

  const { scrollY } = useScroll();
  const scrollVelocity = useSpring(0, { damping: 50, stiffness: 400 });

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? latest;
    const diff = latest - prev;
    directionRef.current = diff > 0 ? 1 : -1;
    scrollVelocity.set(diff);
  });

  const x = useTransform(
    scrollVelocity,
    [-300, 0, 300],
    [
      -baseVelocity * 80 * directionRef.current,
      0,
      baseVelocity * 80 * directionRef.current,
    ]
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
