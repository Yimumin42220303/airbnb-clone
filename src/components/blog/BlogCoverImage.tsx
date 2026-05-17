"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary-loader";

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * 블로그 대표 이미지. Cloudinary URL만 next/image+커스텀 로더로 최적화하고,
 * 그 외(로컬 경로·Blob·임의 HTTPS 등)는 일반 img로 두어 remotePatterns 500을 피합니다.
 */
export default function BlogCoverImage({
  src,
  alt,
  fill,
  className,
  sizes,
  priority,
}: Props) {
  if (!src.trim()) return null;

  if (src.startsWith("/") || !isCloudinaryUrl(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(fill && "absolute inset-0 h-full w-full", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      loader={cloudinaryLoader}
    />
  );
}
