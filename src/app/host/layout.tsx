import HostMobileNav from "@/components/host/HostMobileNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </div>
      <HostMobileNav />
    </>
  );
}
