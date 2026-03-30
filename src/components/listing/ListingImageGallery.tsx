"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-optimize";

type ImageItem = { id: string; url: string; sortOrder: number };

type Props = {
  images: ImageItem[];
  title: string;
};

export default function ListingImageGallery({ images, title }: Props) {
  const { t } = useHostTranslations();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative aspect-video w-full bg-minbak-light-gray overflow-hidden">
            <Image
              src={optimizeCloudinaryUrl(images[0].url, 1200)}
              alt={title}
              fill
              className="object-contain cursor-pointer bg-black/5"
          sizes="(max-width: 1200px) 100vw, 800px"
          onClick={() => {
            setShowAll(false);
            setLightboxIndex(0);
          }}
        />
        {lightboxIndex === 0 && (
          <Lightbox
            images={images}
            title={title}
            currentIndex={0}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => setLightboxIndex(null)}
            onNext={() => setLightboxIndex(null)}
          />
        )}
      </div>
    );
  }

  const main = images[0];
  const rest = images.slice(1, 5);

  return (
    <>
      <div className="relative w-full">
        {/* 모바일: 가로 스와이프 캐러셀 (CSS scroll-snap) */}
        <div
          className="md:hidden flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory snap-center rounded-xl bg-white touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-label={t("gallery.viewAllPhotos")}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className="relative flex-shrink-0 w-full min-w-full aspect-square snap-center snap-always bg-minbak-light-gray overflow-hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-minbak-black/20"
              onClick={() => {
                setShowAll(false);
                setLightboxIndex(i);
              }}
            >
              <Image
                src={optimizeCloudinaryUrl(img.url, 800)}
                alt={i === 0 ? title : `${title} ${i + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={i === 0}
              />
            </button>
          ))}
        </div>

        {/* PC: 기존 그리드 (메인 1 + 서브 2x2) */}
        <div className="hidden md:grid grid-cols-2 gap-2 md:gap-3 overflow-hidden bg-white w-full rounded-xl">
          <div className="aspect-square w-full rounded-xl overflow-hidden">
            <button
              type="button"
              className="relative w-full h-full bg-minbak-light-gray overflow-hidden focus:outline-none focus:ring-2 focus:ring-minbak-black/20 rounded-xl"
              onClick={() => {
                setShowAll(false);
                setLightboxIndex(0);
              }}
            >
              <Image
                src={optimizeCloudinaryUrl(main.url, 1200)}
                alt={title}
                fill
                className="object-cover"
                sizes="50vw"
                priority
              />
            </button>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-3 aspect-square w-full rounded-xl overflow-hidden">
            {rest.map((img, i) => (
              <div key={img.id} className="w-full h-full min-h-0 rounded-xl overflow-hidden">
                <button
                  type="button"
                  className="relative w-full h-full bg-minbak-light-gray overflow-hidden focus:outline-none focus:ring-2 focus:ring-minbak-black/20 rounded-xl"
                  onClick={() => {
                    setShowAll(false);
                    setLightboxIndex(i + 1);
                  }}
                >
                  <Image
                    src={optimizeCloudinaryUrl(img.url, 600)}
                    alt={`${title} ${i + 2}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1200px) 25vw, 360px"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <button
            type="button"
            className="absolute bottom-4 right-4 min-h-[44px] px-4 py-2.5 flex items-center bg-white/95 border border-minbak-light-gray rounded-minbak text-[14px] font-medium shadow-minbak hover:bg-white z-10"
            onClick={() => {
              setLightboxIndex(null);
              setShowAll(true);
            }}
          >
            {t("gallery.viewAllPhotos")}
          </button>
        )}
      </div>
      {lightboxIndex !== null && !showAll && (
        <Lightbox
          images={images}
          title={title}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
          }
          onNext={() =>
            setLightboxIndex((lightboxIndex + 1) % images.length)
          }
        />
      )}
      {showAll && (
        <AllPhotosOverlay
          images={images}
          title={title}
          onClose={() => setShowAll(false)}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  title,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: ImageItem[];
  title: string;
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { t } = useHostTranslations();
  const img = images[currentIndex];

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] bg-black/90 flex flex-col items-center justify-center pt-[max(72px,calc(56px+env(safe-area-inset-top,0px)))] md:pt-[80px] pb-14"
      role="dialog"
      aria-modal="true"
      aria-label={t("gallery.viewAllPhotos")}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-[max(72px,calc(56px+env(safe-area-inset-top,0px)))] md:top-[80px] right-4 p-2 text-white hover:bg-white/10 rounded-minbak-full z-10"
        aria-label={t("gallery.close")}
      >
        <X className="w-8 h-8" />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-minbak-full z-10"
            aria-label={t("gallery.prev")}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-minbak-full z-10"
            aria-label={t("gallery.next")}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}
      <div
        className="relative w-full flex-1 min-h-0 max-w-5xl mx-4 max-h-[calc(100vh-72px-3.5rem)] md:max-h-[calc(100vh-80px-3.5rem)]"
        onClick={(e) => e.stopPropagation()} // 실제 이미지 영역 클릭 시에는 닫히지 않도록
      >
        <Image
          src={optimizeCloudinaryUrl(img.url, 1200)}
          alt={`${title} - ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="90vw"
        />
      </div>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-minbak-caption">
        {currentIndex + 1} / {images.length}
      </p>
    </div>
  );
}

function AllPhotosOverlay({
  images,
  title,
  onClose,
}: {
  images: ImageItem[];
  title: string;
  onClose: () => void;
}) {
  const { t } = useHostTranslations();
  const [aspects, setAspects] = useState<Record<number, { w: number; h: number }>>({});

  const handleLoad = (index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const w = target.naturalWidth;
    const h = target.naturalHeight;
    if (w && h) {
      setAspects((prev) => ({ ...prev, [index]: { w, h } }));
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-white flex flex-col">
      <header className="flex items-center justify-between px-4 md:px-10 py-4 border-b border-minbak-light-gray shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-minbak-light-gray hover:bg-minbak-bg"
          aria-label={t("gallery.back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-minbak-body md:text-[17px] font-semibold text-minbak-black">
            {t("gallery.morePhotos")}
          </h2>
          <p className="text-minbak-caption text-minbak-gray">
            {t("gallery.totalCount", { count: images.length })}
          </p>
        </div>
        <div className="w-8 h-8" aria-hidden />
      </header>
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 py-4 md:py-6 lg:py-8 min-h-0">
        <div
          className="w-full max-w-7xl mx-auto columns-2 md:columns-3 lg:columns-4 [column-gap:1rem] md:[column-gap:1.25rem] lg:[column-gap:1.5rem]"
          style={{ columnFill: "balance" as const }}
        >
          {images.map((img, index) => {
            const ratio = aspects[index];
            const aspectStyle = ratio
              ? { aspectRatio: `${ratio.w} / ${ratio.h}` }
              : { aspectRatio: "4/3" };
            return (
              <div
                key={img.id ?? `${img.url}-${index}`}
                className="break-inside-avoid w-full mb-4 md:mb-5 lg:mb-6 overflow-hidden rounded-xl bg-minbak-light-gray"
              >
                <div className="relative w-full" style={aspectStyle}>
                  <Image
                    src={optimizeCloudinaryUrl(img.url, 800)}
                    alt={`${title} 추가 사진 ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    onLoad={(e) => handleLoad(index, e)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
