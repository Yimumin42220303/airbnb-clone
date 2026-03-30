"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * LP用LINE QR画像。public/lp-host-line-qr.png が無い場合はプレースホルダー表示
 */
export default function LpLineQrImage() {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="w-40 h-40 bg-minbak-light-gray rounded-minbak flex items-center justify-center overflow-hidden relative">
      {!imgError && (
        <Image
          src="/lp-host-line-qr.png"
          alt="LINE友達追加QRコード"
          width={160}
          height={160}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      )}
      <div
        className={`w-full h-full flex-col items-center justify-center gap-1 p-2 text-center text-minbak-caption text-minbak-gray absolute inset-0 ${imgError ? "flex" : "hidden"}`}
        aria-hidden
      >
        <span>QR画像を</span>
        <span>配置してください</span>
      </div>
    </div>
  );
}
