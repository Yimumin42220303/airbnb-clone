import Link from "next/link";
import { getPostsPaginated } from "@/lib/blog";
import BlogCoverImage from "@/components/blog/BlogCoverImage";
import { BLOG_CATEGORIES, getCategoryLabel, isValidCategory } from "@/lib/blog-categories";

export const revalidate = 300;

const PAGE_SIZE = 10;

export const metadata = {
  title: "블로그",
  description:
    "도쿄민박 블로그 – 도쿄 숙소, 일본 여행 꿀팁, 민박 이용 후기와 운영 소식을 전해 드립니다.",
  openGraph: {
    title: "블로그",
    description:
      "도쿄민박 블로그 – 도쿄 숙소, 일본 여행 꿀팁, 민박 이용 후기와 운영 소식을 전해 드립니다.",
    type: "website",
  },
  alternates: {
    types: {
      "application/rss+xml": {
        url: "https://tokyominbak.net/rss.xml",
        title: "도쿄민박 블로그 RSS",
      },
    },
  },
};

type Props = {
  searchParams: Promise<{ page?: string; category?: string }>;
};

/** page/category를 보존한 블로그 목록 URL 생성 */
function blogHref(page: number, category: string | null): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

export default async function BlogListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const pageParam = Number.parseInt(sp?.page ?? "1", 10);
  const requestedPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const activeCategory = isValidCategory(sp?.category) ? sp.category : null;

  const { posts, page, totalPages } = await getPostsPaginated({
    page: requestedPage,
    pageSize: PAGE_SIZE,
    category: activeCategory,
  });

  const activeLabel = getCategoryLabel(activeCategory);

  return (
    <main className="min-h-screen pt-24">
      <div className="max-w-[900px] mx-auto px-6 py-10">
          <h1 className="text-minbak-h1 font-semibold text-minbak-black mb-2">
            블로그
          </h1>
          <p className="text-minbak-body text-minbak-gray mb-6">
            도쿄민박 소식과 도쿄·일본 여행 정보를 전해 드립니다.
          </p>

          {/* 카테고리 필터 */}
          <nav className="flex flex-wrap gap-2 mb-10" aria-label="블로그 카테고리">
            <Link
              href={blogHref(1, null)}
              className={`px-3.5 py-1.5 rounded-full text-minbak-caption font-medium border transition-colors ${
                activeCategory === null
                  ? "bg-minbak-primary text-white border-minbak-primary"
                  : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/40"
              }`}
            >
              전체
            </Link>
            {BLOG_CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={blogHref(1, c.id)}
                className={`px-3.5 py-1.5 rounded-full text-minbak-caption font-medium border transition-colors ${
                  activeCategory === c.id
                    ? "bg-minbak-primary text-white border-minbak-primary"
                    : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/40"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </nav>

          {posts.length === 0 ? (
            <p className="text-minbak-body text-minbak-gray py-12">
              {activeLabel
                ? `'${activeLabel}' 분류에 아직 글이 없습니다.`
                : "아직 등록된 글이 없습니다."}
            </p>
          ) : (
            <ul className="space-y-10">
              {posts.map((post) => {
                const catLabel = getCategoryLabel(post.category);
                return (
                <li key={post.id}>
                  <Link
                    href={`/blog/${encodeURIComponent(post.slug)}`}
                    className="block group border border-minbak-light-gray rounded-minbak overflow-hidden bg-white hover:border-minbak-primary/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {post.coverImage && (
                        <div className="relative w-full sm:w-56 h-40 sm:h-auto sm:min-h-[180px] flex-shrink-0 bg-minbak-light-gray">
                          <BlogCoverImage
                            src={post.coverImage}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 224px"
                          />
                        </div>
                      )}
                      <div className="p-5 flex-1 min-w-0">
                        {catLabel && (
                          <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-minbak-bg text-minbak-caption font-medium text-minbak-gray">
                            {catLabel}
                          </span>
                        )}
                        <h2 className="text-minbak-h3 font-semibold text-minbak-black group-hover:text-minbak-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-minbak-body text-minbak-gray mt-2 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <p className="text-minbak-caption text-minbak-gray mt-3">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString(
                                "ko-KR",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )
                            : ""}
                          {post.authorName && (
                            <span className="ml-2">· {post.authorName}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
                );
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 mt-12"
              aria-label="블로그 페이지 이동"
            >
              {page > 1 ? (
                <Link
                  href={blogHref(page - 1, activeCategory)}
                  className="px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black hover:bg-minbak-bg transition-colors"
                  rel="prev"
                >
                  이전
                </Link>
              ) : (
                <span className="px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-gray/50 cursor-not-allowed">
                  이전
                </span>
              )}
              <span className="px-3 text-minbak-body text-minbak-gray">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={blogHref(page + 1, activeCategory)}
                  className="px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black hover:bg-minbak-bg transition-colors"
                  rel="next"
                >
                  다음
                </Link>
              ) : (
                <span className="px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-gray/50 cursor-not-allowed">
                  다음
                </span>
              )}
            </nav>
          )}
      </div>
    </main>
  );
}
