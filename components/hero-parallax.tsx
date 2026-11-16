"use client";

import { useEffect } from "react";

/**
 * Parallaxe discrète du visuel du hero : suit légèrement le pointeur et
 * accompagne le défilement. Les variables sont posées sur la section,
 * puis consommées en CSS via la propriété `translate`.
 */
export function HeroParallax() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    if (reduce.matches || !finePointer.matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const animate = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      hero.style.setProperty("--hero-px", `${currentX.toFixed(2)}px`);
      hero.style.setProperty("--hero-py", `${currentY.toFixed(2)}px`);
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        frame = requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    };

    const kick = () => {
      if (!frame) frame = requestAnimationFrame(animate);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches) return;
      const rect = hero.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
      kick();
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      kick();
    };

    hero.addEventListener("pointermove", onPointerMove);
    hero.addEventListener("pointerleave", onPointerLeave);

    return () => {
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerleave", onPointerLeave);
      cancelAnimationFrame(frame);
      hero.style.removeProperty("--hero-px");
      hero.style.removeProperty("--hero-py");
    };
  }, []);

  return null;
}
