import type { MetadataRoute } from "next";
import { getPostsForSitemap } from "@/lib/blog";
import { prisma } from "@/lib/prisma";
import {
  resolveContentLastModified,
  staticLastModified,
} from "@/lib/sitemap-config";
import { SITEMAP_ORIGIN } from "@/lib/site-url";
import { ORGANIC_LANDING_PATHS } from "@/lib/organic-landing";

/** DB 변경 반영 (새 블로그·숙소 공개 시 자동 갱신) */
export const revalidate = 3600;

function siteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? SITEMAP_ORIGIN : `${SITEMAP_ORIGIN}${normalized}`;
}

function dedupeEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return entry.url.startsWith(SITEMAP_ORIGIN);
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: Awaited<ReturnType<typeof getPostsForSitemap>> = [];
  let listings: { id: string; updatedAt: Date; createdAt: Date }[] = [];

  try {
    [posts, listings] = await Promise.all([
      getPostsForSitemap(),
      prisma.listing.findMany({
        where: { status: "approved", hidden: false },
        select: { id: true, updatedAt: true, createdAt: true },
      }),
    ]);
  } catch (e) {
    console.error(
      "[sitemap] DB fetch failed, returning static routes only:",
      e instanceof Error ? e.message : e
    );
  }

  const latestBlogActivity = posts.reduce<Date | null>((max, post) => {
    const d = resolveContentLastModified(post);
    return !max || d > max ? d : max;
  }, null);

  const blogIndexLastMod = latestBlogActivity ?? staticLastModified("/blog");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl("/"),
      lastModified: staticLastModified("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: siteUrl("/search"),
      lastModified: staticLastModified("/search"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: siteUrl("/blog"),
      lastModified: blogIndexLastMod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: siteUrl("/about"),
      lastModified: staticLastModified("/about"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: siteUrl("/trust"),
      lastModified: staticLastModified("/trust"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: siteUrl("/policy"),
      lastModified: staticLastModified("/policy"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: siteUrl("/agreement"),
      lastModified: staticLastModified("/agreement"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: siteUrl("/recommend"),
      lastModified: staticLastModified("/recommend"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: siteUrl("/lp/host"),
      lastModified: staticLastModified("/lp/host"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...ORGANIC_LANDING_PATHS.map((path) => ({
      url: siteUrl(path),
      lastModified: staticLastModified(path),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: siteUrl(`/blog/${encodeURIComponent(post.slug)}`),
    lastModified: resolveContentLastModified(post),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const listingUrls: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: siteUrl(`/listing/${listing.id}`),
    lastModified: resolveContentLastModified(listing),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return dedupeEntries([...staticRoutes, ...blogUrls, ...listingUrls]);
}
