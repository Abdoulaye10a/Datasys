"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GalleryLightbox, type GallerySlide } from "@/components/gallery-lightbox";
import { PublicationFeature } from "@/components/publication-feature";
import type { PublicationCard, Section } from "@/lib/content";

const pageSize = 6;

export function PublicationGrid({
  items,
  section,
  children,
  numberOffset = 0,
  hideEmptyResults = false,
}: {
  items: PublicationCard[];
  section: Section;
  children?: ReactNode;
  numberOffset?: number;
  hideEmptyResults?: boolean;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxSlug, setLightboxSlug] = useState<string | null>(null);
  const pendingAnchor = useRef<string | null>(null);
  const [anchorRequest, setAnchorRequest] = useState(0);
  const gallerySlides = useMemo<GallerySlide[]>(() => {
    if (section !== "galerie") return [];
    return items.flatMap((item) => {
      const image = item.previewImage || item.image;
      return image ? [{ item, image }] : [];
    });
  }, [items, section]);
  const lightboxIndex = lightboxSlug
    ? gallerySlides.findIndex((slide) => slide.item.slug === lightboxSlug)
    : -1;
  const pageCount = Math.ceil(items.length / pageSize);
  const lastPage = Math.max(pageCount, 1);
  const visiblePage = Math.min(currentPage, lastPage);
  const visibleItems = items.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);
  const showLead = visiblePage === 1;

  useEffect(() => {
    function revealHashedPublication() {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return;
      const index = items.findIndex((item) => item.slug === hash);
      if (index < 0) return;
      setCurrentPage(Math.floor(index / pageSize) + 1);
      pendingAnchor.current = hash;
      setAnchorRequest((request) => request + 1);
    }

    revealHashedPublication();
    window.addEventListener("hashchange", revealHashedPublication);
    return () => window.removeEventListener("hashchange", revealHashedPublication);
  }, [items]);

  useEffect(() => {
    const anchor = pendingAnchor.current;
    if (!anchor) return;
    const target = document.getElementById(anchor);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
    pendingAnchor.current = null;
  }, [anchorRequest, visiblePage]);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), lastPage));
  }

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(page - 1, 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(page + 1, lastPage));
  }

  function closeLightbox() {
    const slug = lightboxSlug;
    setLightboxSlug(null);
    if (!slug) return;
    requestAnimationFrame(() => {
      document
        .getElementById(`gallery-open-${slug}`)
        ?.focus({ preventScroll: true });
    });
  }

  function navigateLightbox(index: number) {
    const slide = gallerySlides[index];
    if (slide) setLightboxSlug(slide.item.slug);
  }

  return (
    <>
      {children}
      {items.length ? (
        <div
          key={visiblePage}
          className={`publication-grid publication-grid-${section} publication-feature-list`}
        >
          {visibleItems.map((item, index) => (
            <PublicationFeature
              key={item.slug}
              item={item}
              section={section}
              index={index}
              lead={showLead && index === 0 && section !== "galerie"}
              number={String(
                numberOffset + (visiblePage - 1) * pageSize + index + 1,
              ).padStart(2, "0")}
              onImageClick={
                section === "galerie"
                  ? () => setLightboxSlug(item.slug)
                  : undefined
              }
            />
          ))}
        </div>
      ) : hideEmptyResults && !items.length ? null : (
        <div className="empty-state">
          <span className="empty-mark">D.</span>
          <h2>De nouvelles publications arrivent bientôt</h2>
          <p>Suivez DATASYS pour découvrir bientôt nos actualités et nos projets.</p>
        </div>
      )}
      {pageCount > 1 && (
        <nav className="pagination" aria-label="Pagination des publications">
          <button
            type="button"
            aria-label="Page précédente"
            disabled={visiblePage <= 1}
            onClick={goToPreviousPage}
            onTouchEnd={(event) => {
              event.preventDefault();
              goToPreviousPage();
            }}
          >
            <ArrowLeft size={16} /> <span className="pagination-button-label">Précédent</span>
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              aria-label={`Page ${page}`}
              aria-current={visiblePage === page ? "page" : undefined}
              disabled={visiblePage === page}
              onClick={() => goToPage(page)}
              onTouchEnd={(event) => {
                event.preventDefault();
                goToPage(page);
              }}
            >
              {page}
            </button>
          ))}
          <span className="pagination-status" aria-live="polite">
            Page <strong>{visiblePage}</strong> sur <strong>{pageCount}</strong>
          </span>
          <button
            type="button"
            aria-label="Page suivante"
            disabled={visiblePage >= pageCount}
            onClick={goToNextPage}
            onTouchEnd={(event) => {
              event.preventDefault();
              goToNextPage();
            }}
          >
            <span className="pagination-button-label">Suivant</span> <ArrowRight size={16} />
          </button>
        </nav>
      )}
      {lightboxIndex >= 0 && (
        <GalleryLightbox
          slides={gallerySlides}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </>
  );
}
