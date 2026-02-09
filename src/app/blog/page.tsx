import Link from "next/link";
import Image from "next/image";
import { Header, Footer } from "@/components/layout";
import { getPosts } from "@/lib/blog";

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
};

export default async function BlogListPage() {
  const posts = await getPosts({ publishedOnly: true });

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">
        <div className="max-w-[900px] mx-auto px-6 py-10">
          <h1 className="text-airbnb-h1 font-semibold text-airbnb-black mb-2">
            블로그
          </h1>
          <p className="text-airbnb-body text-airbnb-gray mb-10">
            도쿄민박 소식과 도쿄·일본 여행 정보를 전해 드립니다.
          </p>

          {posts.length === 0 ? (
            <p className="text-airbnb-body text-airbnb-gray py-12">
              아직 등록된 글이 없습니다.
            </p>
          ) : (
            <ul className="space-y-10">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block group border border-airbnb-light-gray rounded-airbnb overflow-hidden bg-white hover:border-minbak-primary/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {post.coverImage && (
                        <div className="relative w-full sm:w-56 h-40 sm:h-auto sm:min-h-[180px] flex-shrink-0 bg-airbnb-light-gray">
                          <Image
                            src={post.coverImage}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 224px"
                          />
                        </div>
                      )}
                      <div className="p-5 flex-1 min-w-0">
                        <h2 className="text-airbnb-h3 font-semibold text-airbnb-black group-hover:text-minbak-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-airbnb-body text-airbnb-gray mt-2 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <p className="text-airbnb-caption text-airbnb-gray mt-3">
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
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
