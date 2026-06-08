/**
 * next/image 커스텀 loader — Cloudinary CDN 직접 변환.
 * `/_next/image`(Vercel Image Optimization)를 거치지 않으므로
 * Vercel Image Transformations 할당량을 소모하지 않습니다.
 */
import type { ImageLoaderProps } from "next/image";

const CLOUDINARY_UPLOAD = "/upload/";
const CLOUDINARY_HOST = "res.cloudinary.com";

export function isCloudinaryUrl(url: string): boolean {
  return !!url && url.includes(CLOUDINARY_HOST) && url.includes(CLOUDINARY_UPLOAD);
}

export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!isCloudinaryUrl(src)) return src;
  const afterUpload = src.split(CLOUDINARY_UPLOAD)[1] ?? "";
  const firstSegment = afterUpload.split("/")[0] ?? "";
  // /upload/ 직후 세그먼트에 쉼표가 있으면 이미 변환 체인 → 이중 삽입 방지
  if (firstSegment.includes(",")) {
    return src;
  }
  const q = quality != null ? `q_${quality}` : "q_auto";
  return src.replace(
    CLOUDINARY_UPLOAD,
    `${CLOUDINARY_UPLOAD}f_auto,${q},w_${width}/`,
  );
}
