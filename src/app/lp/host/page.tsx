import Image from "next/image";
import Link from "next/link";
import { HOST_LP_LINE_ADD_URL } from "@/lib/constants";
import LpLineQrImage from "@/components/lp/LpLineQrImage";

export const metadata = {
  title: "ホスト様募集 | 韓国人ゲスト集客 × 都内小部屋の新OTA",
  description:
    "韓国人ゲストが中心の民泊OTA。好立地・コスパの良い都内小部屋（1〜4名）を大募集。管理代行会社様向け手数料10%、一般ホスト様20%。",
};

/** LINEアイコン（簡易SVG） */
function LineIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

export default function HostLpPage() {
  return (
    <div className="min-h-screen bg-minbak-bg text-minbak-black">
      {/* シンプルヘッダー: ロゴ + LINEボタン */}
      <header className="sticky top-0 z-50 border-b border-minbak-light-gray bg-white">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo-minbak.png"
              alt="東京民泊"
              width={120}
              height={28}
              className="h-7 md:h-8 w-auto"
              unoptimized
            />
          </Link>
          <a
            href={HOST_LP_LINE_ADD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#06C755] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <LineIcon className="w-5 h-5" />
            LINEで相談する
          </a>
        </div>
      </header>

      <main>
        {/* ヒーロー */}
        <section className="bg-white border-b border-minbak-light-gray">
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-minbak-black leading-tight mb-4">
              韓国人ゲスト集客 × 都内小部屋の新OTA!
            </h1>
            <p className="text-minbak-body-lg text-minbak-gray mb-8 max-w-[600px] mx-auto">
              韓国人ゲストが中心。好立地・コスパの良い小部屋（1〜4名）を大募集しています。まずはお気軽にLINEでご相談ください。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={HOST_LP_LINE_ADD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#06C755] text-white text-base font-semibold hover:opacity-90 transition-opacity"
              >
                <LineIcon className="w-6 h-6" />
                LINEで相談する
              </a>
              <a
                href="https://tokyominbak.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-minbak-black text-minbak-black text-base font-semibold hover:bg-minbak-black hover:text-white transition-colors"
              >
                どんな感じのOTAか見てみる
              </a>
            </div>
          </div>
        </section>

        {/* こんな施設を募集しています */}
        <section className="py-16 md:py-20">
          <div className="max-w-[900px] mx-auto px-4 md:px-6">
            <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-6 text-center">
              こんな施設を募集しています
            </h2>
            <div className="bg-white border border-minbak-light-gray rounded-minbak p-6 md:p-8">
              <p className="text-minbak-body text-minbak-gray mb-4">
                当OTAには、少人数・小部屋・コスパ重視の宿を求める問い合わせが多く寄せられています。受け皿を補強するため、以下のような施設を大募集しています。
              </p>
              <ul className="space-y-3 text-minbak-body text-minbak-black">
                <li className="flex items-start gap-2">
                  <span className="text-minbak-primary font-bold">・</span>
                  好立地（駅近・アクセス良好）
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-minbak-primary font-bold">・</span>
                  コスパの良い料金設定
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-minbak-primary font-bold">・</span>
                  1〜4名向けの小部屋
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3つの強み（対等に並べて訴求） */}
        <section className="py-16 md:py-20 bg-white border-y border-minbak-light-gray">
          <div className="max-w-[900px] mx-auto px-4 md:px-6">
            <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-10 text-center">
              3つの強み
            </h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* 安い手数料 */}
              <div className="p-6 border border-minbak-light-gray rounded-minbak bg-minbak-bg/50">
                <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-minbak-primary text-white text-minbak-body font-bold mb-4">
                  1
                </span>
                <h3 className="text-minbak-title font-semibold text-minbak-black mb-3">
                  安いOTA手数料
                </h3>
                <div className="space-y-2 text-minbak-body text-minbak-gray">
                  <p>
                    <strong className="text-minbak-black">管理代行会社様：</strong>
                    売上の10%（ゲストとのメッセージ代行なし）
                  </p>
                  <p>
                    <strong className="text-minbak-black">一般ホスト様：</strong>
                    売上の20%（ゲストとのメッセージやり取り代行込み）
                  </p>
                </div>
              </div>

              {/* きめ細かいサポート */}
              <div className="p-6 border border-minbak-light-gray rounded-minbak bg-minbak-bg/50">
                <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-minbak-primary text-white text-minbak-body font-bold mb-4">
                  2
                </span>
                <h3 className="text-minbak-title font-semibold text-minbak-black mb-3">
                  ホスト様との信頼に基づく<br />きめ細かいサポート
                </h3>
                <p className="text-minbak-body text-minbak-gray">
                  マイクロOTAだからこそできる、 face-to-faceの関係。駆け付け代行や、一方的な返金を行わないなど、ホスト様を守る運用を心がけています。
                </p>
              </div>

              {/* AIマッチング */}
              <div className="p-6 border border-minbak-light-gray rounded-minbak bg-minbak-bg/50">
                <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-minbak-primary text-white text-minbak-body font-bold mb-4">
                  3
                </span>
                <h3 className="text-minbak-title font-semibold text-minbak-black mb-3">
                  AIによる相性の良い紹介
                </h3>
                <p className="text-minbak-body text-minbak-gray">
                  宿の説明文・立地・レビューデータに基づき、AIがゲストにぴったりの宿を推奨。ゲストと宿のミスマッチが少なく、満足度の高い予約につながります。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 料金表 */}
        <section className="py-16 md:py-20">
          <div className="max-w-[900px] mx-auto px-4 md:px-6">
            <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-8 text-center">
              料金
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full max-w-[500px] mx-auto border-collapse border border-minbak-light-gray rounded-minbak overflow-hidden bg-white">
                <thead>
                  <tr className="bg-minbak-bg">
                    <th className="border-b border-minbak-light-gray px-4 py-3 text-left text-minbak-body font-semibold text-minbak-black">
                      区分
                    </th>
                    <th className="border-b border-minbak-light-gray px-4 py-3 text-left text-minbak-body font-semibold text-minbak-black">
                      手数料
                    </th>
                    <th className="border-b border-minbak-light-gray px-4 py-3 text-left text-minbak-body font-semibold text-minbak-black">
                      備考
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-minbak-light-gray px-4 py-3 text-minbak-body text-minbak-black">
                      管理代行会社様
                    </td>
                    <td className="border-b border-minbak-light-gray px-4 py-3 text-minbak-body font-semibold text-minbak-black">
                      売上の10%
                    </td>
                    <td className="border-b border-minbak-light-gray px-4 py-3 text-minbak-caption text-minbak-gray">
                      ゲストとのメッセージ代行なし
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-minbak-body text-minbak-black">
                      一般ホスト様
                    </td>
                    <td className="px-4 py-3 text-minbak-body font-semibold text-minbak-black">
                      売上の20%
                    </td>
                    <td className="px-4 py-3 text-minbak-caption text-minbak-gray">
                      ゲストとのメッセージやり取り代行込み
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA: LINE友達追加 */}
        <section className="py-16 md:py-24 bg-minbak-primary/5 border-t border-minbak-light-gray">
          <div className="max-w-[900px] mx-auto px-4 md:px-6 text-center">
            <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
              まずはお気軽にご相談ください
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-8">
              QRコードまたはボタンからLINE友達追加でご連絡ください。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="bg-white p-6 rounded-minbak border border-minbak-light-gray shadow-minbak">
                <p className="text-minbak-caption text-minbak-gray mb-3">QRコードで友達追加</p>
                <LpLineQrImage />
              </div>
              <div className="flex flex-col items-center gap-4">
                <p className="text-minbak-caption text-minbak-gray">または</p>
                <a
                  href={HOST_LP_LINE_ADD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#06C755] text-white text-base font-semibold hover:opacity-90 transition-opacity"
                >
                  <LineIcon className="w-6 h-6" />
                  LINEで相談する
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* LP用フッター（最小限） */}
      <footer className="border-t border-minbak-light-gray bg-white py-6">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 text-center">
          <Link
            href="/"
            className="text-minbak-caption text-minbak-gray hover:text-minbak-black hover:underline"
          >
            ← 東京民泊トップへ
          </Link>
        </div>
      </footer>
    </div>
  );
}
