"use client";

import { useEffect } from "react";

/**
 * Mounts an IntersectionObserver that adds `.is-visible` to every element
 * with the `.reveal` class, triggering the CSS fade-up transition defined
 * in globals.css. Runs once on mount (client-side only).
 *
 * Place this once in PublicLayout so it covers all marketing sections.
 */
export function RevealObserver() {
  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

    if (!("IntersectionObserver" in window)) {
      // Fallback: show everything immediately if IntersectionObserver not supported
      reveals.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Renders nothing — side-effect only
  return null;
}
