import type { ReactNode } from "react";
import { Suspense } from "react";
import { CalendarDays, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/prisma/generated/client/client";
import { getSiteSettings } from "@/lib/site-info";
import { prisma } from "@/lib/prisma";
import { AdminMobileNavigation } from "@/components/admin-mobile-navigation";

export async function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; role: UserRole };
}) {
  const [settings, unreadMessages] = await Promise.all([
    getSiteSettings(),
    user.role === "ADMIN"
      ? prisma.message.count({ where: { readAt: null } })
      : Promise.resolve(0),
  ]);

  return (
    <div className="admin-layout">
      <Suspense fallback={null}>
        <AdminMobileNavigation
          logoUrl={settings.logoUrl}
          legalName={settings.legalName}
          user={user}
          unreadMessages={unreadMessages}
        />
      </Suspense>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-status"><span className="admin-status-dot" /><ShieldCheck size={16} /><span>Espace de publication</span></div>
          <span className="admin-top-date"><CalendarDays size={15} /> {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date())}</span>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
