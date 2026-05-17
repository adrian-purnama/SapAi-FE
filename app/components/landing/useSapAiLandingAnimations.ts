"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, type RefObject } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollTrigger + timeline animations for the SapAi marketing landing.
 * Respects prefers-reduced-motion.
 */
export function useSapAiLandingAnimations(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      const heroSection = el.querySelector("[data-hero-section]");
      const heroLines = el.querySelectorAll("[data-hero-line]");
      const heroVisual = el.querySelector("[data-hero-visual]");
      const floatCards = el.querySelectorAll("[data-float-card]");
      const reveals = el.querySelectorAll("[data-reveal]");
      const revealCardBlocks = el.querySelectorAll("[data-reveal-cards]");
      const testimonials = el.querySelectorAll("[data-testimonial]");
      const sectionHeads = el.querySelectorAll("[data-section-head]");
      const parallaxSlow = el.querySelectorAll("[data-parallax-slow]");
      const parallaxFast = el.querySelectorAll("[data-parallax-fast]");
      const orbs = el.querySelectorAll("[data-orb]");
      const glowLines = el.querySelectorAll("[data-glow-line]");
      const integrationItems = el.querySelectorAll("[data-integration-item]");

      if (heroLines.length) gsap.set(heroLines, { opacity: 0, y: 48 });
      if (heroVisual) gsap.set(heroVisual, { opacity: 0, scale: 0.94, y: 44 });
      if (floatCards.length) gsap.set(floatCards, { opacity: 0, scale: 0.9, y: 24 });

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (heroLines.length) intro.to(heroLines, { opacity: 1, y: 0, duration: 0.85, stagger: 0.09 });
      if (heroVisual)
        intro.to(
          heroVisual,
          { opacity: 1, scale: 1, y: 0, duration: 1.05 },
          heroLines.length ? "-=0.45" : undefined,
        );
      if (floatCards.length) {
        const overlapPrior = heroLines.length || heroVisual ? "-=0.55" : undefined;
        intro.to(floatCards, { opacity: 1, scale: 1, y: 0, duration: 0.65, stagger: 0.07 }, overlapPrior);
      }

      reveals.forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 56,
          duration: 0.95,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 88%",
            end: "top 55%",
            toggleActions: "play none none reverse",
          },
        });
      });

      revealCardBlocks.forEach((block) => {
        const cards = block.querySelectorAll("[data-reveal-card]");
        gsap.from(cards, {
          opacity: 0,
          y: 44,
          scale: 0.97,
          duration: 0.7,
          stagger: 0.09,
          ease: "power2.out",
          scrollTrigger: {
            trigger: block,
            start: "top 84%",
            toggleActions: "play none none reverse",
          },
        });
      });

      testimonials.forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 48,
          rotateX: -6,
          transformOrigin: "center top",
          duration: 0.85,
          delay: i * 0.04,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 91%",
            toggleActions: "play none none reverse",
          },
        });
      });

      sectionHeads.forEach((head) => {
        const children = head.querySelectorAll(":scope > *");
        gsap.from(children, {
          opacity: 0,
          y: 32,
          duration: 0.75,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: {
            trigger: head,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });
      });

      integrationItems.forEach((item, i) => {
        gsap.from(item, {
          opacity: 0,
          y: 24,
          scale: 0.96,
          duration: 0.55,
          delay: i * 0.03,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            start: "top 92%",
            toggleActions: "play none none reverse",
          },
        });
      });

      if (heroSection) {
        if (parallaxSlow.length) {
          gsap.to(parallaxSlow, {
            y: -48,
            ease: "none",
            scrollTrigger: {
              trigger: heroSection,
              start: "top top",
              end: "bottom top",
              scrub: 1.15,
            },
          });
        }
        if (parallaxFast.length) {
          gsap.to(parallaxFast, {
            y: -100,
            ease: "none",
            scrollTrigger: {
              trigger: heroSection,
              start: "top top",
              end: "bottom top",
              scrub: 0.55,
            },
          });
        }
      }

      if (orbs.length) {
        gsap.to(orbs, {
          y: "+=32",
          x: "+=18",
          duration: 7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: { each: 2.2, from: "random" },
        });
      }

      if (glowLines.length) {
        gsap.to(glowLines, {
          opacity: 0.35,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.4,
        });
      }
    }, el);

    return () => ctx.revert();
    // Landing animations mount once with stable root ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single mount
  }, []);
}
