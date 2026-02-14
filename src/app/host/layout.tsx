import { cookies } from "next/headers";
import { getHostLocaleFromCookie } from "@/lib/host-i18n";
import HostLocaleProvider from "@/components/host/HostLocaleProvider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialLocale = getHostLocaleFromCookie(cookieStore.toString());
  return <HostLocaleProvider initialLocale={initialLocale}>{children}</HostLocaleProvider>;
}
