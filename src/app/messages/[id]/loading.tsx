import { Header } from "@/components/layout";
import { MessageThreadSkeleton } from "@/components/ui/Skeleton";

export default function MessageThreadLoading() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <MessageThreadSkeleton />
      </main>
    </>
  );
}
