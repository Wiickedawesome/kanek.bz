"use client";

import { useEffect, useRef } from "react";

interface Vector2D {
  x: number;
  y: number;
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 };
  vel: Vector2D = { x: 0, y: 0 };
  acc: Vector2D = { x: 0, y: 0 };
  target: Vector2D = { x: 0, y: 0 };

  closeEnoughTarget = 100;
  maxSpeed = 1.0;
  maxForce = 0.1;
  particleSize = 10;
  isKilled = false;

  startColor = { r: 0, g: 0, b: 0 };
  targetColor = { r: 0, g: 0, b: 0 };
  colorWeight = 0;
  colorBlendRate = 0.01;

  move() {
    let proximityMult = 1;
    const distance = Math.sqrt(
      Math.pow(this.pos.x - this.target.x, 2) +
        Math.pow(this.pos.y - this.target.y, 2)
    );

    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget;
    }

    const towardsTarget = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    };

    const magnitude = Math.sqrt(
      towardsTarget.x * towardsTarget.x + towardsTarget.y * towardsTarget.y
    );
    if (magnitude > 0) {
      towardsTarget.x =
        (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult;
      towardsTarget.y =
        (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult;
    }

    const steer = {
      x: towardsTarget.x - this.vel.x,
      y: towardsTarget.y - this.vel.y,
    };

    const steerMagnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
    if (steerMagnitude > 0) {
      steer.x = (steer.x / steerMagnitude) * this.maxForce;
      steer.y = (steer.y / steerMagnitude) * this.maxForce;
    }

    this.acc.x += steer.x;
    this.acc.y += steer.y;

    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D, drawAsPoints: boolean) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(
        this.colorWeight + this.colorBlendRate,
        1.0
      );
    }

    const currentColor = {
      r: Math.round(
        this.startColor.r +
          (this.targetColor.r - this.startColor.r) * this.colorWeight
      ),
      g: Math.round(
        this.startColor.g +
          (this.targetColor.g - this.startColor.g) * this.colorWeight
      ),
      b: Math.round(
        this.startColor.b +
          (this.targetColor.b - this.startColor.b) * this.colorWeight
      ),
    };

    if (drawAsPoints) {
      ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
    } else {
      ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  kill(width: number, height: number) {
    if (!this.isKilled) {
      const randomPos = this.generateRandomPos(
        width / 2,
        height / 2,
        (width + height) / 2
      );
      this.target.x = randomPos.x;
      this.target.y = randomPos.y;

      this.startColor = {
        r:
          this.startColor.r +
          (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g:
          this.startColor.g +
          (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b:
          this.startColor.b +
          (this.targetColor.b - this.startColor.b) * this.colorWeight,
      };
      this.targetColor = { r: 0, g: 0, b: 0 };
      this.colorWeight = 0;

      this.isKilled = true;
    }
  }

  private generateRandomPos(x: number, y: number, mag: number): Vector2D {
    const randomX = Math.random() * (x * 2 + mag);
    const randomY = Math.random() * (y * 2 + mag);

    const direction = {
      x: randomX - x,
      y: randomY - y,
    };

    const magnitude = Math.sqrt(
      direction.x * direction.x + direction.y * direction.y
    );
    if (magnitude > 0) {
      direction.x = (direction.x / magnitude) * mag;
      direction.y = (direction.y / magnitude) * mag;
    }

    return {
      x: x + direction.x,
      y: y + direction.y,
    };
  }
}

// Kanek brand color palette for particles — dark mode
const KANEK_COLORS_DARK = [
  { r: 81, g: 193, b: 82 },   // accent-green #51c152
  { r: 101, g: 246, b: 123 }, // neon-green #65f67b
  { r: 73, g: 103, b: 246 },  // accent-blue #4967f6
  { r: 132, g: 214, b: 96 },  // brighter leaf for ERRANDS
  { r: 72, g: 214, b: 176 },  // brighter jade for JOBS
];

// Richer/deeper colors for light backgrounds
const KANEK_COLORS_LIGHT = [
  { r: 42, g: 120, b: 43 },   // deeper green
  { r: 20, g: 100, b: 20 },   // forest
  { r: 50, g: 75, b: 200 },   // deeper blue
  { r: 30, g: 60, b: 15 },    // dark forest
  { r: 10, g: 130, b: 90 },   // dark emerald
];

interface ParticleTextEffectProps {
  words?: string[];
  className?: string;
  theme?: string;
}

const DEFAULT_WORDS = ["kanek", "RIDES", "DELIVER", "KANEK", "BELIZE"];

export function ParticleTextEffect({
  words = DEFAULT_WORDS,
  className = "",
  theme = "dark",
}: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const wordIndexRef = useRef(0);
  const lastWordChangeTimeRef = useRef<number | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const pixelSteps = 6;
  const drawAsPoints = true;
  const INITIAL_WORD_HOLD_MS = 6000;
  const WORD_HOLD_MS = 4000;

  const generateRandomPos = (
    x: number,
    y: number,
    mag: number
  ): Vector2D => {
    const canvas = canvasRef.current;
    const randomX = Math.random() * (canvas?.width ?? 1600);
    const randomY = Math.random() * (canvas?.height ?? 500);

    const direction = {
      x: randomX - x,
      y: randomY - y,
    };

    const magnitude = Math.sqrt(
      direction.x * direction.x + direction.y * direction.y
    );
    if (magnitude > 0) {
      direction.x = (direction.x / magnitude) * mag;
      direction.y = (direction.y / magnitude) * mag;
    }

    return {
      x: x + direction.x,
      y: y + direction.y,
    };
  };

  const nextWord = (word: string, canvas: HTMLCanvasElement) => {
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext("2d")!;

    offscreenCtx.fillStyle = "white";
    const baseFontSize = Math.min(canvas.width * 0.12, 180);
    let fontSize = baseFontSize;
    offscreenCtx.font = `bold ${fontSize}px Arial`;
    const targetWordWidth = canvas.width * 0.32;
    const measuredWidth = offscreenCtx.measureText(word).width;
    if (measuredWidth > 0 && measuredWidth < targetWordWidth) {
      fontSize = Math.min(
        baseFontSize * (targetWordWidth / measuredWidth),
        Math.min(canvas.width * 0.16, 240)
      );
    }
    offscreenCtx.font = `bold ${fontSize}px Arial`;
    offscreenCtx.textAlign = "center";
    offscreenCtx.textBaseline = "middle";
    offscreenCtx.fillText(word, canvas.width / 2, canvas.height / 2);

    const imageData = offscreenCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    const pixels = imageData.data;

    // Pick a Kanek brand color based on theme
    const colors = themeRef.current === "light" ? KANEK_COLORS_LIGHT : KANEK_COLORS_DARK;
    const newColor =
      colors[wordIndexRef.current % colors.length];

    const particles = particlesRef.current;
    let particleIndex = 0;

    const coordsIndexes: number[] = [];
    for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
      coordsIndexes.push(i);
    }

    for (let i = coordsIndexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coordsIndexes[i], coordsIndexes[j]] = [
        coordsIndexes[j],
        coordsIndexes[i],
      ];
    }

    for (const coordIndex of coordsIndexes) {
      const pixelIndex = coordIndex;
      const alpha = pixels[pixelIndex + 3];

      if (alpha > 0) {
        const x = (pixelIndex / 4) % canvas.width;
        const y = Math.floor(pixelIndex / 4 / canvas.width);

        let particle: Particle;

        if (particleIndex < particles.length) {
          particle = particles[particleIndex];
          particle.isKilled = false;
          particleIndex++;
        } else {
          particle = new Particle();

          const randomPos = generateRandomPos(
            canvas.width / 2,
            canvas.height / 2,
            (canvas.width + canvas.height) / 2
          );
          particle.pos.x = randomPos.x;
          particle.pos.y = randomPos.y;

          particle.maxSpeed = Math.random() * 6 + 4;
          particle.maxForce = particle.maxSpeed * 0.05;
          particle.particleSize = Math.random() * 6 + 6;
          particle.colorBlendRate = Math.random() * 0.0275 + 0.0025;

          particles.push(particle);
        }

        particle.startColor = {
          r:
            particle.startColor.r +
            (particle.targetColor.r - particle.startColor.r) *
              particle.colorWeight,
          g:
            particle.startColor.g +
            (particle.targetColor.g - particle.startColor.g) *
              particle.colorWeight,
          b:
            particle.startColor.b +
            (particle.targetColor.b - particle.startColor.b) *
              particle.colorWeight,
        };
        particle.targetColor = newColor;
        particle.colorWeight = 0;

        particle.target.x = x;
        particle.target.y = y;
      }
    }

    for (let i = particleIndex; i < particles.length; i++) {
      particles[i].kill(canvas.width, canvas.height);
    }
  };

  const animate = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (lastWordChangeTimeRef.current === null) {
      lastWordChangeTimeRef.current = timestamp;
    }

    const ctx = canvas.getContext("2d")!;
    const particles = particlesRef.current;

    // Background with motion blur — adapts to theme
    const isLight = themeRef.current === "light";
    ctx.fillStyle = isLight ? "rgba(246, 246, 244, 0.1)" : "rgba(10, 20, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.move();
      particle.draw(ctx, drawAsPoints);

      if (particle.isKilled) {
        if (
          particle.pos.x < 0 ||
          particle.pos.x > canvas.width ||
          particle.pos.y < 0 ||
          particle.pos.y > canvas.height
        ) {
          particles.splice(i, 1);
        }
      }
    }

    const holdMs = wordIndexRef.current === 0 ? INITIAL_WORD_HOLD_MS : WORD_HOLD_MS;
    if (timestamp - lastWordChangeTimeRef.current >= holdMs) {
      wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
      nextWord(words[wordIndexRef.current], canvas);
      lastWordChangeTimeRef.current = timestamp;
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect user's motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio > 1 ? 1.5 : 1);
      canvas.height = rect.height * (window.devicePixelRatio > 1 ? 1.5 : 1);
      nextWord(words[wordIndexRef.current], canvas);
      lastWordChangeTimeRef.current = null;
    };

    resize();
    window.addEventListener("resize", resize);

    if (!prefersReducedMotion) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Animated particle text effect"
      className={`block ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
