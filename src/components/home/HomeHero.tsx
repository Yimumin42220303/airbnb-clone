"use client";

import { useState } from "react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

/** 히어로 배경 이미지: env 또는 public/hero-bg.jpg, 로드 실패 시 기본 도쿄 이미지 */
const HERO_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=80";

export default function HomeHero() {
  const t = useHostTranslations().t;
  const heroImageUrl =
    process.env.NEXT_PUBLIC_HERO_IMAGE_URL || "/hero-bg.jpg";
  const [bgSrc, setBgSrc] = useState(heroImageUrl);
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <section className="relative min-h-[380px] sm:min-h-[420px] md:min-h-[640px] flex flex-col items-center justify-center bg-gray-900 text-white px-4 pt-[140px] pb-10 sm:pt-[152px] sm:pb-12 md:pt-[172px] md:pb-[100px] md:px-6 overflow-hidden">
      {/* 배경 이미지: 비디오 미재생 시 보임. 비디오 재생되면 가림 */}
      <img
        src={bgSrc}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${videoPlaying ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-hidden
        onError={() => setBgSrc(HERO_IMAGE_FALLBACK)}
      />
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"}
        aria-hidden
        onPlaying={() => setVideoPlaying(true)}
        onEnded={() => setVideoPlaying(false)}
        onPause={() => setVideoPlaying(false)}
      />
      <div className="absolute inset-0 bg-black/55 z-[1]" aria-hidden />
      <div className="relative z-10 flex flex-col items-center gap-2 text-center max-w-[900px]">
        <h1 className="text-minbak-h1 md:text-framer-h1 font-extrabold leading-tight">
          {t("guest.heroTitle1")}
          <br />
          {t("guest.heroTitle2")}
        </h1>
        <p className="text-minbak-body md:text-minbak-body-lg text-white/90 max-w-[600px] px-2">
          {t("guest.heroSub")}
        </p>
      </div>
      <div className="relative z-10 mt-6 md:mt-8 bg-black/50 rounded-[16px] md:rounded-[20px] px-4 py-4 md:px-[30px] md:py-5 flex flex-col gap-2 w-full max-w-[560px]">
        <ul className="flex flex-col gap-2 text-left">
          {[
            t("guest.bullet1"),
            t("guest.bullet2"),
            t("guest.bullet3"),
          ].map((text, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-sm leading-none">✓</span>
              </span>
              <span className="text-minbak-body text-white">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
