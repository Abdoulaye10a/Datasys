"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Enveloppe un lien ou un bouton d’un léger effet magnétique au survol.
 * Inactif sur tactile et en mouvement réduit.
 */
export function Magnetic({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      node.style.transform = `translate3d(${(x * 14).toFixed(2)}px, ${(y * 10).toFixed(2)}px, 0)`;
    };

    const reset = () => {
      node.style.transform = "";
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", reset);
    node.addEventListener("focusout", reset);

    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", reset);
      node.removeEventListener("focusout", reset);
      node.style.transform = "";
    };
  }, []);

  return (
    <span ref={ref} className={`magnetic ${className}`.trim()}>
      {children}
    </span>
  );
}
