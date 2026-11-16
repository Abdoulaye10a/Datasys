"use client";

import { useEffect, useRef } from "react";
import type { PublicationType } from "@/prisma/generated/client/client";
import { recordPublicationViews } from "@/app/publication-actions";

export function PublicationViewTracker({
  publicationType,
  publicationId,
}: {
  publicationType: PublicationType;
  publicationId: string;
}) {
  const targetRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let recorded = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !recorded && !timer) {
        timer = setTimeout(() => {
          recorded = true;
          void recordPublicationViews(publicationType, [publicationId]).catch((error: unknown) => {
            console.error("Impossible d’enregistrer la vue de la publication.", error);
          });
          observer.disconnect();
        }, 5000);
      } else if (!entry.isIntersecting && timer) {
        clearTimeout(timer);
        timer = undefined;
      }
    });

    observer.observe(target);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [publicationId, publicationType]);

  return <span ref={targetRef} className="publication-view-sentinel" aria-hidden="true" />;
}