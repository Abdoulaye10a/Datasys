import { redirect } from "next/navigation";
import LoginPage from "@/app/admin/login/login-form";
import { getAdminSpace, getSession } from "@/lib/auth";
import { getAdminPath } from "@/lib/admin-paths";
import { getSiteSettings } from "@/lib/site-info";

export const instant = false;

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect(getAdminPath("/admin", session.role));
  const space = await getAdminSpace();
  const settings = await getSiteSettings();
  return <LoginPage logoUrl={settings.logoUrl} space={space} />;
}
