import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { prisma } from "@/lib/prisma";
import { getPosts } from "@/lib/blog";

export const metadata = {
  title: "목업 확인",
  description: "시드(목업) 데이터로 화면을 확인할 수 있는 링크 모음입니다.",
};

export default async function MockPage() {
  const [listings, posts] = await Promise.all([
    prisma.listing.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
    getPosts({ publishedOnly: true }),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">
        <div className="max-w-[640px] mx-auto px-6 py-10">
          <h1 className="text-airbnb-h1 font-semibold text-airbnb-black mb-2">
            목업 확인
          </h1>
          <p className="text-airbnb-body text-airbnb-gray mb-8">
            시드 데이터가 적용된 화면을 한곳에서 확인할 수 있습니다.{" "}
            <code className="px-1.5 py-0.5 bg-airbnb-light-gray rounded text-airbnb-caption">
              npm run db:seed
            </code>{" "}
            또는{" "}
            <code className="px-1.5 py-0.5 bg-airbnb-light-gray rounded text-airbnb-caption">
              npm run dev:mock
            </code>{" "}
            실행 후 아래 링크로 이동해 보세요.
          </p>

          <section className="space-y-6">
            <div>
              <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-2">
                공통
              </h2>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href="/"
                    className="text-minbak-primary hover:underline"
                  >
                    홈
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    className="text-minbak-primary hover:underline"
                  >
                    숙소 검색
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-minbak-primary hover:underline"
                  >
                    블로그 목록
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-2">
                숙소 상세 (목업 6개)
              </h2>
              <ul className="space-y-1.5">
                {listings.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/listing/${l.id}`}
                      className="text-minbak-primary hover:underline"
                    >
                      {l.title}
                    </Link>
                  </li>
                ))}
                {listings.length === 0 && (
                  <li className="text-airbnb-caption text-airbnb-gray">
                    시드를 실행하면 숙소 링크가 나타납니다.
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-2">
                블로그 글 (목업 2편)
              </h2>
              <ul className="space-y-1.5">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="text-minbak-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
                {posts.length === 0 && (
                  <li className="text-airbnb-caption text-airbnb-gray">
                    시드를 실행하면 블로그 링크가 나타납니다.
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-2">
                관리자·호스트
              </h2>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href="/auth/signin"
                    className="text-minbak-primary hover:underline"
                  >
                    로그인 (admin@example.com 등으로 로그인 후 관리자 메뉴 이용)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="text-minbak-primary hover:underline"
                  >
                    관리자 대시보드
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/blog"
                    className="text-minbak-primary hover:underline"
                  >
                    블로그 관리
                  </Link>
                </li>
                <li>
                  <Link
                    href="/host/listings"
                    className="text-minbak-primary hover:underline"
                  >
                    호스트 숙소 목록 (host@example.com)
                  </Link>
                </li>
              </ul>
            </div>
          </section>

          <p className="mt-10 text-airbnb-caption text-airbnb-gray">
            DB 직접 확인:{" "}
            <code className="px-1.5 py-0.5 bg-airbnb-light-gray rounded">
              npm run db:studio
            </code>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
