import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoading from "./loading";

export const instant = false;
export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<AdminLoading />}>{children}</Suspense>;
}
