"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Bell,
  Files,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Newspaper,
  PanelsTopLeft,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import type { UserRole } from "@/prisma/generated/client/client";
import { leaveAdminAction, logoutAction } from "@/app/admin/actions";
import { getAdminPath } from "@/lib/admin-paths";

const navigationGroups = [
  {
    label: "Pilotage",
    icon: PanelsTopLeft,
    items: [{ label: "Vue d’ensemble", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Contenus",
    icon: Files,
    items: [
      { label: "Actualités", href: "/admin/actualites", icon: Newspaper },
      { label: "Activités", href: "/admin/activites", icon: Bell },
      { label: "Annonces", href: "/admin/annonces", icon: Megaphone },
      { label: "Projets", href: "/admin/projets", icon: FolderKanban },
      { label: "Galerie", href: "/admin/galerie", icon: Files },
    ],
  },
  {
    label: "Gestion",
    icon: SlidersHorizontal,
    adminOnly: true,
    items: [
      { label: "Utilisateurs", href: "/admin/utilisateurs", icon: Users },
      { label: "Messages", href: "/admin/messages", icon: Mail },
      { label: "Personnalisation", href: "/admin/personnalisation", icon: SlidersHorizontal },
    ],
  },
] as const;

export function AdminMobileNavigation({
  logoUrl,
  legalName,
  user,
  unreadMessages = 0,
}: {
  logoUrl: string;
  legalName: string;
  user: { name: string; role: UserRole };
  unreadMessages?: number;
}) {
  const menuInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const isActive = (href: string) => {
    const scopedHref = getAdminPath(href, user.role);
    return pathname === scopedHref || (href !== "/admin" && pathname.startsWith(`${scopedHref}/`));
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuInputRef.current?.checked) {
        menuInputRef.current.checked = false;
        document.body.style.overflow = "";
      }
    };
    const closeOnDesktopResize = () => {
      if (window.matchMedia("(min-width: 801px)").matches && menuInputRef.current) {
        menuInputRef.current.checked = false;
        document.body.style.overflow = "";
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktopResize);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktopResize);
    };
  }, []);

  useEffect(() => {
    if (menuInputRef.current) menuInputRef.current.checked = false;
    document.body.style.overflow = "";
  }, [pathname]);

  return (
    <div className="admin-mobile-navigation">
      <input
        ref={menuInputRef}
        className="admin-mobile-menu-state"
        id="admin-mobile-menu-state"
        type="checkbox"
        aria-label="Afficher la navigation d’administration"
        aria-controls="admin-navigation"
        onChange={(event) => {
          document.body.style.overflow = event.currentTarget.checked ? "hidden" : "";
        }}
      />
      <label
        className="admin-mobile-menu-toggle"
        htmlFor="admin-mobile-menu-state"
      >
        <Menu size={19} />
        <span>Menu</span>
        {unreadMessages > 0 && (
          <span className="admin-mobile-menu-count" aria-label={`${unreadMessages} message${unreadMessages === 1 ? "" : "s"} non lu${unreadMessages === 1 ? "" : "s"}`}>
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </span>
        )}
      </label>
      <label
        className="admin-mobile-backdrop"
        htmlFor="admin-mobile-menu-state"
        aria-label="Fermer le menu d’administration"
      />
      <aside id="admin-navigation" className="admin-sidebar">
        <label className="admin-mobile-sidebar-close" htmlFor="admin-mobile-menu-state" aria-label="Fermer le menu d’administration">
          <X size={19} />
        </label>
      <Link className="admin-brand" href={getAdminPath("/admin", user.role)}>
        <Image className="admin-brand-logo" src={logoUrl} alt={legalName} width={625} height={320} unoptimized />
        <span className="admin-brand-label">ESPACE ADMIN</span>
      </Link>
      <nav className="admin-nav" aria-label="Navigation d’administration">
        {navigationGroups.map((group) => {
          if ("adminOnly" in group && group.adminOnly && user.role !== "ADMIN") {
            return null;
          }
          const GroupIcon = group.icon;
          return (
            <div className="admin-nav-group" key={group.label}>
              <div className="admin-nav-label"><GroupIcon size={14} /> {group.label.toUpperCase()}</div>
              {group.items.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={getAdminPath(href, user.role)}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  {href === "/admin/messages" && unreadMessages > 0 && (
                    <span className="admin-nav-badge">{unreadMessages > 99 ? "99+" : unreadMessages}</span>
                  )}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="admin-sidebar-bottom">
        <form action={leaveAdminAction}>
          <button className="admin-public-link" type="submit">
            <ArrowUpRight size={16} /> Voir le site public
          </button>
        </form>
        <div className="admin-user">
          <span className="admin-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
          <span>
            <strong>{user.name}</strong>
            <small>{user.role === "ADMIN" ? "Administrateur" : "Rédacteur"}</small>
          </span>
        </div>
        <form action={logoutAction}>
          <button className="admin-logout" type="submit">
            <LogOut size={16} /> Se déconnecter
          </button>
        </form>
      </div>
      </aside>
    </div>
  );
}
