"use client";

/**
 * LP用LINE QR画像。public/lp-host-line-qr.png が無い場合はプレースホルダー表示
 */
export default function LpLineQrImage() {
  return (
    <div className="w-40 h-40 bg-minbak-light-gray rounded-minbak flex items-center justify-center overflow-hidden relative">
      <img
        src="/lp-host-line-qr.png"
        alt="LINE友達追加QRコード"
        className="w-full h-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className="hidden w-full h-full flex-col items-center justify-center gap-1 p-2 text-center text-minbak-caption text-minbak-gray absolute inset-0"
        aria-hidden
      >
        <span>QR画像を</span>
        <span>配置してください</span>
      </div>
    </div>
  );
}
