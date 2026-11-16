"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useRef, type Ref } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  FolderKanban,
  House,
  Images,
  Mail,
  Megaphone,
  Menu,
  Newspaper,
  X,
} from "lucide-react";
import type { SiteSettings } from "@/lib/site-info";

const links = [
  { label: "Accueil", href: "/", icon: House },
  { label: "Actualités", href: "/actualites", icon: Newspaper },
  { label: "Activités", href: "/activites", icon: Activity },
  { label: "Annonces", href: "/annonces", icon: Megaphone },
  { label: "Projets", href: "/projets", icon: FolderKanban },
  { label: "Galerie", href: "/galerie", icon: Images },
  { label: "Contact", href: "/contact", icon: Mail },
];

function isLinkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function scrollPageToTop() {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  window.scrollTo({ top: 0, behavior });
}

function MainNav({
  onNavigate,
  pathname,
  className,
  id,
  navRef,
  lineRef,
}: {
  onNavigate: () => void;
  pathname: string | null;
  className: string;
  id: string;
  navRef?: Ref<HTMLElement>;
  lineRef?: Ref<HTMLSpanElement>;
}) {
  return (
    <nav ref={navRef} id={id} className={`main-nav ${className}`} aria-label="Navigation principale">
      {links.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={(event) => {
            const isCurrentPage = pathname === href;
            onNavigate();
            if (isCurrentPage) {
              event.preventDefault();
              scrollPageToTop();
            }
          }}
          aria-current={pathname && isLinkActive(pathname, href) ? "page" : undefined}
        >
          <Icon className="mobile-nav-link-icon" size={18} aria-hidden="true" />
          <span>{label}</span>
          <ArrowUpRight className="mobile-nav-link-arrow" size={15} aria-hidden="true" />
        </Link>
      ))}
      {lineRef && <span ref={lineRef} className="nav-line" aria-hidden="true" />}
    </nav>
  );
}

function ActiveMainNav({
  onNavigate,
  className,
  id,
  withLine = false,
}: {
  onNavigate: () => void;
  className: string;
  id: string;
  withLine?: boolean;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!withLine) return;
    const nav = navRef.current;
    const line = lineRef.current;
    if (!nav || !line) return;

    const getActiveLink = () =>
      nav.querySelector<HTMLElement>('a[aria-current="page"]') ?? nav.querySelector<HTMLElement>("a");

    const moveTo = (link: HTMLElement | null, animate: boolean) => {
      if (!link) return;
      if (!animate) line.style.transition = "none";
      line.style.width = `${link.offsetWidth}px`;
      line.style.transform = `translateX(${link.offsetLeft}px)`;
      line.classList.add("is-ready");
      if (!animate) {
        line.getBoundingClientRect();
        line.style.transition = "";
      }
    };

    moveTo(getActiveLink(), line.classList.contains("is-ready"));

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      if (link instanceof HTMLElement && nav.contains(link)) moveTo(link, true);
    };
    const returnToActive = () => moveTo(getActiveLink(), true);
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      if (link instanceof HTMLElement && nav.contains(link)) moveTo(link, true);
    };
    const onResize = () => moveTo(getActiveLink(), false);

    nav.addEventListener("pointerover", onPointerOver);
    nav.addEventListener("pointerleave", returnToActive);
    nav.addEventListener("focusin", onFocusIn);
    nav.addEventListener("focusout", returnToActive);
    window.addEventListener("resize", onResize);

    return () => {
      nav.removeEventListener("pointerover", onPointerOver);
      nav.removeEventListener("pointerleave", returnToActive);
      nav.removeEventListener("focusin", onFocusIn);
      nav.removeEventListener("focusout", returnToActive);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname, withLine]);

  return (
    <MainNav
      onNavigate={onNavigate}
      pathname={pathname}
      className={className}
      id={id}
      navRef={withLine ? navRef : undefined}
      lineRef={withLine ? lineRef : undefined}
    />
  );
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
    document.body.style.overflow = "";
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const details = menuRef.current;
      if (!details?.open) return;
      event.preventDefault();
      details.open = false;
      document.body.style.overflow = "";
      details.querySelector<HTMLElement>("summary")?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="container nav-wrap">
          <Link
            className="brand"
            href="/"
            aria-label="DATASYS, accueil"
            onClick={(event) => {
              closeMenu();
              if (pathname === "/") {
                event.preventDefault();
                scrollPageToTop();
              }
            }}
          >
            <Image className="brand-logo" src={settings.logoUrl} alt={settings.legalName} width={625} height={320} priority unoptimized />
          </Link>
          <Suspense fallback={<MainNav onNavigate={closeMenu} pathname={null} className="main-nav-desktop" id="site-navigation-desktop" />}>
            <ActiveMainNav onNavigate={closeMenu} className="main-nav-desktop" id="site-navigation-desktop" withLine />
          </Suspense>
          <details
            ref={menuRef}
            className="site-menu-disclosure"
            onToggle={(event) => {
              document.body.style.overflow = event.currentTarget.open ? "hidden" : "";
            }}
          >
            <summary className="menu-toggle" aria-controls="site-navigation-mobile">
              <Menu className="menu-toggle-open-icon" size={19} />
              <X className="menu-toggle-close-icon" size={19} />
              <span className="menu-toggle-open-label">Menu</span>
              <span className="menu-toggle-close-label">Fermer</span>
            </summary>
            <div className="mobile-menu-panel">
              <div className="mobile-menu-heading">
                <span>EXPLORER DATASYS</span>
                <strong>Nos rubriques</strong>
                <p>Découvrez nos actualités, activités et solutions.</p>
              </div>
              <Suspense fallback={<MainNav onNavigate={closeMenu} pathname={null} className="main-nav-mobile" id="site-navigation-mobile" />}>
                <ActiveMainNav onNavigate={closeMenu} className="main-nav-mobile" id="site-navigation-mobile" />
              </Suspense>
              <Link className="mobile-menu-cta" href="/contact" onClick={closeMenu}>
                <span>
                  <strong>Un projet en tête ?</strong>
                  <small>Parlons-en ensemble</small>
                </span>
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            </div>
          </details>
          <Link className="nav-cta" href="/contact" onClick={closeMenu}>
            Parlons de votre projet <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <button
        type="button"
        className="site-menu-backdrop"
        aria-label="Fermer le menu"
        onClick={closeMenu}
      />
    </>
  );
}
