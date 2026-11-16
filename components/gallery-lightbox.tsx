"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, X } from "lucide-react";
import type { PublicationCard } from "@/lib/content";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export type GallerySlide = {
  item: PublicationCard;
  image: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export function GalleryLightbox({
  slides,
  index,
  onClose,
  onNavigate,
}: {
  slides: GallerySlide[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const slide = slides[index];

  const goPrevious = useCallback(() => {
    onNavigate((index - 1 + slides.length) % slides.length);
  }, [index, onNavigate, slides.length]);

  const goNext = useCallback(() => {
    onNavigate((index + 1) % slides.length);
  }, [index, onNavigate, slides.length]);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft" && slides.length > 1) {
        event.preventDefault();
        goPrevious();
        return;
      }
      if (event.key === "ArrowRight" && slides.length > 1) {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrevious, onClose, slides.length]);

  if (!slide) return null;

  const { item } = slide;
  const date = formatDate(item.date);
  const titleId = "gallery-lightbox-title";

  return createPortal(
    <div
      ref={dialogRef}
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="gallery-lightbox-bar">
        <span
          className="gallery-lightbox-counter"
          role="status"
          aria-live="polite"
          aria-label={`Image ${index + 1} sur ${slides.length}`}
        >
          <strong aria-hidden="true">{String(index + 1).padStart(2, "0")}</strong>
          <span aria-hidden="true">/</span>
          <span aria-hidden="true">{String(slides.length).padStart(2, "0")}</span>
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          className="gallery-lightbox-close"
          onClick={onClose}
          aria-label="Fermer l’image agrandie"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div
        className="gallery-lightbox-stage"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {slides.length > 1 && (
          <button
            type="button"
            className="gallery-lightbox-nav is-prev"
            onClick={goPrevious}
            aria-label="Image précédente"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        )}

        <figure
          className="gallery-lightbox-figure"
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => {
            touchStart.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchStart.current === null || slides.length < 2) return;
            const distance = event.changedTouches[0].clientX - touchStart.current;
            touchStart.current = null;
            if (Math.abs(distance) < 48) return;
            if (distance > 0) goPrevious();
            else goNext();
          }}
        >
          <img
            className="gallery-lightbox-image"
            src={slide.image}
            alt={item.excerpt || item.title}
          />
          <figcaption className="gallery-lightbox-caption">
            <span className="gallery-lightbox-category">
              {item.category || "Galerie DATASYS"}
            </span>
            <h2 id={titleId}>{item.title}</h2>
            {item.excerpt.trim() && item.excerpt.trim() !== item.title.trim() && (
              <p>{item.excerpt}</p>
            )}
            <span className="gallery-lightbox-meta">
              {date && (
                <span>
                  <CalendarDays size={14} aria-hidden="true" /> {date}
                </span>
              )}
              {item.location && (
                <span>
                  <MapPin size={14} aria-hidden="true" /> {item.location}
                </span>
              )}
            </span>
          </figcaption>
        </figure>

        {slides.length > 1 && (
          <button
            type="button"
            className="gallery-lightbox-nav is-next"
            onClick={goNext}
            aria-label="Image suivante"
          >
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
