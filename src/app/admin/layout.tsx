import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/host/listings");
  }

  return <main className="min-h-screen pt-24">{children}</main>;
}
