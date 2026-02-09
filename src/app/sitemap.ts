import { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { prisma } from "@/lib/prisma";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tokyominbak.example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, listings] = await Promise.all([
    getPosts({ publishedOnly: true }),
    prisma.listing.findMany({
      select: { id: true, updatedAt: true },
    }),
  ]);

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
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

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...listingUrls,
    ...blogUrls,
  ];
}
