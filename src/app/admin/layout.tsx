import { getAdminUser } from "@/lib/admin";
import { Header, Footer } from "@/components/layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getAdminUser(); // 목업: 로그인 없이 관리자 화면 확인 가능

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">{children}</main>
      <Footer />
    </>
  );
}
