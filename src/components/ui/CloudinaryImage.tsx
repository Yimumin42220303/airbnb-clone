"use client";

import Image, { type ImageProps } from "next/image";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";

/**
 * Cloudinary 이미지 전용 next/image 래퍼.
 * 서버 컴포넌트에서도 안전하게 사용할 수 있도록 loader를 내부 바인딩합니다.
 * /_next/image 를 거치지 않아 Vercel Image Transformations 할당량을 소모하지 않습니다.
 */
export default function CloudinaryImage(props: ImageProps) {
  /* alt는 호출부에서 전달 — 스프레드로 jsx-a11y가 정적 분석 못 함 */
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- ImageProps에 alt 포함
    <Image {...props} loader={cloudinaryLoader} />
  );
}
