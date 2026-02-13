"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

type ImageItem = { id: string; url: string; sortOrder: number };

type Props = {
  images: ImageItem[];
  title: string;
};

export default function ListingImageGallery({ images, title }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative aspect-video w-full bg-minbak-light-gray overflow-hidden">
            <Image
              src={images[0].url}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[6px] md:gap-[8px] overflow-hidden bg-white w-full">
          {/* 메인 1장: 정사각형, 라운드 */}
          <div className="aspect-square w-full max-md:max-w-full rounded-xl overflow-hidden">
            <button
              type="button"
              className="relative w-full h-full bg-airbnb-light-gray overflow-hidden focus:outline-none focus:ring-2 focus:ring-airbnb-black/20 rounded-xl"
              onClick={() => {
                setShowAll(false);
                setLightboxIndex(0);
              }}
            >
              <Image
                src={main.url}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </button>
          </div>
          {/* 서브 4장: 2x2 정사각형, 라운드 */}
          <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-[6px] md:gap-[8px] aspect-square w-full rounded-xl overflow-hidden">
            {rest.map((img, i) => (
              <div key={img.id} className="w-full h-full min-h-0 rounded-xl overflow-hidden">
                <button
                  type="button"
                  className="relative w-full h-full bg-airbnb-light-gray overflow-hidden focus:outline-none focus:ring-2 focus:ring-airbnb-black/20 rounded-xl"
                  onClick={() => {
                    setShowAll(false);
                    setLightboxIndex(i + 1);
                  }}
                >
                  <Image
                    src={img.url}
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
            className="absolute bottom-4 right-4 min-h-[44px] px-4 py-2.5 flex items-center bg-white/95 border border-airbnb-light-gray rounded-airbnb text-[14px] font-medium shadow-airbnb hover:bg-white z-10"
            onClick={() => {
              setLightboxIndex(null);
              setShowAll(true);
            }}
          >
            사진 모두 보기
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
  const img = images[currentIndex];

  // ESC 키로 닫기
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
      className="fixed inset-0 z-[10001] bg-black/90 flex flex-col items-center justify-center pt-[72px] md:pt-[80px] pb-14"
      role="dialog"
      aria-modal="true"
      aria-label="사진 갤러리"
      onClick={onClose} // 바깥(오버레이) 클릭 시 닫기
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-[72px] md:top-[80px] right-4 p-2 text-white hover:bg-white/10 rounded-airbnb-full z-10"
        aria-label="닫기"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-airbnb-full z-10"
            aria-label="이전"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-airbnb-full z-10"
            aria-label="다음"
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
          src={img.url}
          alt={`${title} - ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="90vw"
        />
      </div>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-airbnb-caption">
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
  return (
    <div className="fixed inset-0 z-[10000] bg-white flex flex-col">
      <header className="flex items-center justify-between px-4 md:px-10 py-4 border-b border-minbak-light-gray">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-minbak-light-gray hover:bg-minbak-bg"
          aria-label="뒤로"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-airbnb-body md:text-[17px] font-semibold text-minbak-black">
            추가 사진
          </h2>
          <p className="text-airbnb-caption text-minbak-gray">
            총 {images.length}장
          </p>
        </div>
        <div className="w-8 h-8" aria-hidden />
      </header>
      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-4 md:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {images.map((img, index) => (
              <div
                key={img.id ?? `${img.url}-${index}`}
                className="relative w-full overflow-hidden rounded-lg bg-minbak-light-gray"
              >
                <div className="relative pb-[75%]">
                  <Image
                    src={img.url}
                    alt={`${title} 추가 사진 ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
