"use client";

import { useCallback, type ReactNode } from "react";
import {
  trackBlogEvent,
  type BlogAnalyticsEventName,
  type BlogDestinationType,
  type BlogLinkType,
} from "@/lib/blog-analytics";

type Props = {
  postSlug: string;
  children: ReactNode;
  className?: string;
};

function classifyHref(href: string): {
  destination_type: BlogDestinationType;
  listing_id?: string;
  link_type: BlogLinkType;
  event: BlogAnalyticsEventName;
} {
  if (href.startsWith("/listing/")) {
    const listing_id = href.replace(/^\/listing\//, "").split("?")[0];
    return {
      destination_type: "listing",
      listing_id,
      link_type: "inline_markdown",
      event: "blog_internal_link_click",
    };
  }
  if (href === "/recommend" || href.startsWith("/recommend?")) {
    return {
      destination_type: "recommend",
      link_type: "recommend_cta",
      event: "blog_recommend_cta_click",
    };
  }
  if (href.startsWith("/blog/")) {
    return {
      destination_type: "blog",
      link_type: "related_post",
      event: "blog_related_post_click",
    };
  }
  if (href.startsWith("http")) {
    return {
      destination_type: "external",
      link_type: "inline_markdown",
      event: "blog_internal_link_click",
    };
  }
  return {
    destination_type: "internal",
    link_type: "inline_markdown",
    event: "blog_internal_link_click",
  };
}

export default function BlogLinkAnalytics({ postSlug, children, className }: Props) {
  const onClickCapture = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor?.href) return;

      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return;

      const linkTypeAttr = anchor.dataset.blogLinkType as BlogLinkType | undefined;
      const listingIdAttr = anchor.dataset.listingId;

      let meta = classifyHref(href);
      if (linkTypeAttr) {
        meta = { ...meta, link_type: linkTypeAttr };
        if (linkTypeAttr === "listing_card" || linkTypeAttr === "listing_image") {
          meta.event = "blog_listing_card_click";
        }
        if (linkTypeAttr === "compare_table") {
          meta.event = "blog_internal_link_click";
          meta.link_type = "compare_table";
        }
        if (linkTypeAttr === "recommend_cta") {
          meta.event = "blog_recommend_cta_click";
        }
        if (linkTypeAttr === "related_post") {
          meta.event = "blog_related_post_click";
        }
      }
      if (listingIdAttr) meta.listing_id = listingIdAttr;

      const destination_url = href.startsWith("http")
        ? href
        : typeof window !== "undefined"
          ? new URL(href, window.location.origin).pathname +
            (new URL(href, window.location.origin).search || "")
          : href;

      trackBlogEvent(meta.event, {
        post_slug: postSlug,
        link_type: meta.link_type,
        destination_type: meta.destination_type,
        destination_url,
        listing_id: meta.listing_id,
        anchor_text: (anchor.textContent || "").trim().slice(0, 120) || undefined,
      });
    },
    [postSlug]
  );

  return (
    <div className={className} onClickCapture={onClickCapture}>
      {children}
    </div>
  );
}
