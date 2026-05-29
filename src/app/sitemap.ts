import { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: Awaited<ReturnType<typeof getPosts>> = [];
  let listings: { id: string; updatedAt: Date }[] = [];
  try {
    [posts, listings] = await Promise.all([
      getPosts({ publishedOnly: true }),
      prisma.listing.findMany({
        where: { status: "approved", hidden: false },
        select: { id: true, updatedAt: true },
      }),
    ]);
  } catch (e) {
    console.error("[sitemap] DB fetch failed, returning static routes only:", e instanceof Error ? e.message : e);
  }

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`,
    lastModified: post.publishedAt || post.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const listingUrls: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${BASE_URL}/listing/${listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/recommend`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/trust`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/agreement`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/lp/host`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];

  return [...staticRoutes, ...listingUrls, ...blogUrls];
}
