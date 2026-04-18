// src/components/ui/cinematic-landing-hero.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import "./cinematic-landing-hero.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  ctaHeading?: string;
  ctaDescription?: string;
}

export function CinematicHero({ 
  brandName = "kanek",
  tagline1 = "Your community,",
  tagline2 = "in your pocket.",
  cardHeading = "Movement, connected.",
  cardDescription = <><span className="text-white font-semibold">kanek</span> connects riders, drivers, and neighbors across all six districts — rides, deliveries, errands, and jobs on one community board.</>,
  metricValue = 6,
  metricLabel = "Districts",
  ctaHeading = "Get moving.",
  ctaDescription = "Download kanek and connect with your community. Free to use, built for Belize.",
  className, 
  ...props 
}: CinematicHeroProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;

      cancelAnimationFrame(requestRef.current);
      
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;

          gsap.to(mockupRef.current, {
            rotationY: xVal * 12,
            rotationX: -yVal * 12,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  },[]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Card starts invisible in-place (fades in, not slides up)
      gsap.set(".main-card", { autoAlpha: 0, scale: 0.95 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });
      gsap.set(".cta-wrapper", { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=7000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        // Phase 0: Hero text stays visible — interactive scroll parallax
        .to(".text-track", { scale: 1.15, y: -40, ease: "none", duration: 1.5 }, 0)
        .to(".text-days", { scale: 1.2, y: -60, ease: "none", duration: 1.5 }, 0)
        .to(".bg-grid-theme", { scale: 1.08, opacity: 0.15, ease: "none", duration: 1.5 }, 0)
        // Phase 1: Hero fades out + card fades in
        .to(".hero-text-wrapper", { scale: 1.2, filter: "blur(24px)", opacity: 0, ease: "power2.inOut", duration: 1.5 }, 1.5)
        .to(".bg-grid-theme", { filter: "blur(10px)", opacity: 0, ease: "power2.inOut", duration: 1.2 }, 1.5)
        .to(".main-card", { autoAlpha: 1, scale: 1, width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 }, 1.5)
        // Phase 2: Card content appears in staggered waves
        // First: phone slides in
        .fromTo(".mockup-scroll-wrapper",
          { y: 80, autoAlpha: 0, scale: 0.8 },
          { y: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.8 }, 2.2
        )
        // Phone widgets fade in inside the phone
        .fromTo(".phone-widget", { y: 30, autoAlpha: 0, scale: 0.9 }, { y: 0, autoAlpha: 1, scale: 1, stagger: 0.2, ease: "back.out(1.4)", duration: 1.2 }, 3.0)
        // Ring + counter animate slowly as you scroll
        .to(".progress-ring", { strokeDashoffset: 60, duration: 3, ease: "power1.inOut" }, 3.0)
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 3, ease: "none" }, 3.0)
        // Left text slides in
        .fromTo(".card-left-text", { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, 3.5)
        // Brand name slides in
        .fromTo(".card-right-text", { x: 40, autoAlpha: 0, scale: 0.85 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, 3.8)
        // Notification badges pop in last, one by one with bounce
        .fromTo(".floating-badge", { y: 40, autoAlpha: 0, scale: 0.7 }, { y: 0, autoAlpha: 1, scale: 1, ease: "back.out(1.7)", duration: 1.2, stagger: 0.4 }, 4.5)
        // Hold to appreciate the full card
        .to({}, { duration: 2 })
        // Phase 2: Exit card content, reveal CTA
        .set(".hero-text-wrapper", { autoAlpha: 0 })
        .set(".cta-wrapper", { autoAlpha: 1 })
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          scale: 0.9, y: -30, autoAlpha: 0, ease: "power3.in", duration: 1, stagger: 0.05,
        })
        // Card fades out revealing CTA behind — scroll ends here
        .to(".main-card", { autoAlpha: 0, scale: 0.95, ease: "power2.inOut", duration: 1.2 })
        .to(".cta-wrapper", { scale: 1, filter: "blur(0px)", ease: "expo.out", duration: 1.2 }, "-=0.8");

    }, containerRef);

    return () => ctx.revert();
  },[metricValue]); 

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-screen overflow-hidden flex items-center justify-center bg-background text-foreground font-sans antialiased", className)}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-50" aria-hidden="true" />

      {/* BACKGROUND LAYER: Hero Texts */}
      <div className="hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-full px-4 will-change-transform" style={{ visibility: "visible", opacity: 1 }}>
        <h1 className="text-track text-3d-matte font-heading text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-2" style={{ visibility: "visible", opacity: 1 }}>
          {tagline1}
        </h1>
        <h1 className="text-days text-silver-matte font-heading text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter" style={{ visibility: "visible", opacity: 1 }}>
          {tagline2}
        </h1>
      </div>

      {/* BACKGROUND LAYER 2: Tactile CTA Buttons */}
      <div className="cta-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-full px-4 gsap-reveal pointer-events-auto will-change-transform">
        <h2 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-silver-matte">
          {ctaHeading}
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl mb-12 max-w-xl mx-auto font-light leading-relaxed">
          {ctaDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <a href="/downloaddownload" aria-label="Download on the App Store" className="btn-modern-light flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <svg className="w-8 h-8 transition-transform group-hover:scale-105" fill="currentColor" viewBox="0 0 384 512" aria-hidden="true">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase -mb-0.5">Download on the</div>
              <div className="text-xl font-bold leading-none tracking-tight">App Store</div>
            </div>
          </a>
          <a href="/downloaddownload" aria-label="Get it on Google Play" className="btn-modern-dark flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
            <svg className="w-7 h-7 transition-transform group-hover:scale-105" fill="currentColor" viewBox="0 0 512 512" aria-hidden="true">
               <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase -mb-0.5">Get it on</div>
              <div className="text-xl font-bold leading-none tracking-tight">Google Play</div>
            </div>
          </a>
        </div>
      </div>

      {/* FOREGROUND LAYER: The Physical Deep Green Card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">
            
            {/* BRAND NAME */}
            <div className="card-right-text gsap-reveal order-1 lg:order-3 flex justify-center lg:justify-end z-20 w-full">
              <h2 className="font-heading text-6xl md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-card-silver-matte lg:mt-0">
                {brandName}
              </h2>
            </div>

            {/* IPHONE MOCKUP */}
            <div className="mockup-scroll-wrapper order-2 lg:order-2 relative w-full h-95 lg:h-150 flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
              
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.65] md:scale-85 lg:scale-100">
                
                <div
                  ref={mockupRef}
                  className="relative w-70 h-145 rounded-[3rem] iphone-bezel flex flex-col will-change-transform transform-style-3d"
                >
                  <div className="absolute top-30 -left-0.75 w-0.75 h-6.25 hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-40 -left-0.75 w-0.75 h-11.25 hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-55 -left-0.75 w-0.75 h-11.25 hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-42.5 -right-0.75 w-0.75 h-17.5 hardware-btn rounded-r-md z-0 scale-x-[-1]" aria-hidden="true" />

                  <div className="absolute inset-1.75 bg-[#050e14] rounded-[2.5rem] overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,1)] text-white z-10">
                    <div className="absolute inset-0 screen-glare z-40 pointer-events-none" aria-hidden="true" />

                    <div className="absolute top-1.25 left-1/2 -translate-x-1/2 w-25 h-7 bg-black rounded-full z-50 flex items-center justify-end px-3 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                    </div>

                    <div className="relative w-full h-full pt-12 px-5 pb-8 flex flex-col">
                      <div className="phone-widget flex justify-between items-center mb-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Today</span>
                          <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">Board</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-white/5 text-neutral-200 flex items-center justify-center font-bold text-sm border border-white/10 shadow-lg shadow-black/50">KN</div>
                      </div>

                      <div className="phone-widget relative w-44 h-44 mx-auto flex items-center justify-center mb-8 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]">
                        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                          <circle cx="88" cy="88" r="64" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                          <circle className="progress-ring" cx="88" cy="88" r="64" fill="none" stroke="#65f67b" strokeWidth="12" />
                        </svg>
                        <div className="text-center z-10 flex flex-col items-center">
                          <span className="counter-val text-4xl font-extrabold tracking-tighter text-white">0</span>
                          <span className="text-[8px] text-emerald-200/50 uppercase tracking-widest font-bold mt-0.5">{metricLabel}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center mr-3 border border-emerald-400/20 shadow-inner">
                            <svg className="w-4 h-4 text-emerald-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-20 bg-neutral-300 rounded-full mb-2 shadow-inner" />
                            <div className="h-1.5 w-12 bg-neutral-600 rounded-full shadow-inner" />
                          </div>
                        </div>
                        <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500/20 to-green-600/5 flex items-center justify-center mr-3 border border-green-400/20 shadow-inner">
                            <svg className="w-4 h-4 text-green-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-16 bg-neutral-300 rounded-full mb-2 shadow-inner" />
                            <div className="h-1.5 w-24 bg-neutral-600 rounded-full shadow-inner" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-30 h-1 bg-white/20 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                    </div>
                  </div>
                </div>

                {/* Floating Glass Badges */}
                <div className="floating-badge absolute flex top-6 lg:top-12 -left-3.75 lg:-left-20 floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 lg:gap-4 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-linear-to-b from-emerald-500/20 to-emerald-900/10 flex items-center justify-center border border-emerald-400/30 shadow-inner">
                    <span className="text-base lg:text-xl drop-shadow-lg" aria-hidden="true">🚗</span>
                  </div>
                  <div>
                    <p className="text-white text-xs lg:text-sm font-bold tracking-tight">Ride Complete</p>
                    <p className="text-emerald-200/50 text-[10px] lg:text-xs font-medium">San Ignacio → Belmopan</p>
                  </div>
                </div>

                <div className="floating-badge absolute flex bottom-12 lg:bottom-20 -right-3.75 lg:-right-20 floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 lg:gap-4 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-linear-to-b from-green-500/20 to-green-900/10 flex items-center justify-center border border-green-400/30 shadow-inner">
                    <span className="text-base lg:text-lg drop-shadow-lg" aria-hidden="true">📦</span>
                  </div>
                  <div>
                    <p className="text-white text-xs lg:text-sm font-bold tracking-tight">Package Sent</p>
                    <p className="text-emerald-200/50 text-[10px] lg:text-xs font-medium">Delivered safely</p>
                  </div>
                </div>

              </div>
            </div>

            {/* CARD TEXT */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full lg:max-w-none px-4 lg:px-0">
              <h3 className="font-heading text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-0 lg:mb-5 tracking-tight">
                {cardHeading}
              </h3>
              <p className="hidden md:block text-green-100/70 text-sm md:text-base lg:text-lg font-normal leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-none">
                {cardDescription}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
