"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
};

export default function ReviewPhotoGallery({ images }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prev = useCallback(
    () => setLightboxIdx((i) => (i != null && i > 0 ? i - 1 : i)),
    []
  );
  const next = useCallback(
    () =>
      setLightboxIdx((i) =>
        i != null && i < images.length - 1 ? i + 1 : i
      ),
    [images.length]
  );

  if (images.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIdx(i)}
            className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-[#ebebeb] hover:border-[#999] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#222]"
          >
            <Image
              src={url}
              alt={`리뷰 사진 ${i + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div>

      {lightboxIdx != null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          {lightboxIdx > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
              aria-label="이전"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {lightboxIdx < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
              aria-label="다음"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div
            className="relative w-[90vw] h-[80vh] max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIdx]}
              alt={`리뷰 사진 ${lightboxIdx + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          <div className="absolute bottom-6 text-white/70 text-sm">
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
