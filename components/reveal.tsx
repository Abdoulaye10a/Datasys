"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Révèle progressivement un bloc à son entrée dans le viewport.
 * Le contenu reste visible sans JavaScript et lorsque les animations sont
 * désactivées : la classe de masquage n’est ajoutée qu’après le montage,
 * et uniquement pour les blocs encore hors écran.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = node.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.92) return;

    node.classList.add("reveal-pending");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          node.classList.remove("reveal-pending");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
