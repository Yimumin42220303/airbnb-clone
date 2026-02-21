import { Header, Footer } from "@/components/layout";
import Link from "next/link";

export const metadata = {
  title: "Beds24 カレンダー連携の手順",
  description: "当サイトとBeds24をiCal/ICSで連携し、二重予約を防ぐ手順です。",
};

export default function Beds24CalendarHelpPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 md:pt-32 pb-16">
        <div className="max-w-[720px] mx-auto px-4 md:px-6">
          <p className="text-minbak-caption text-minbak-primary font-medium tracking-widest uppercase mb-2">
            HELP
          </p>
          <h1 className="text-minbak-h1 font-bold text-minbak-black mb-6">
            Beds24 カレンダー連携の手順
          </h1>
          <p className="text-minbak-body text-minbak-gray mb-8">
            当サイトと Beds24 を iCal/ICS で連携すると、<strong>二重予約を防げます</strong>。
            Beds24 と連携している Airbnb・Booking.com・じゃらん なども含めて、カレンダーが同期されます。
          </p>

          <section className="space-y-6 mb-10">
            <h2 className="text-minbak-h3 font-semibold text-minbak-black">
              ステップ1: 当サイトの予約を Beds24 に反映する
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-minbak-body text-minbak-gray">
              <li>当サイトにログインし、<strong>숙소 수정</strong>（宿泊施設編集）→ <strong>캘린더 연동</strong>（カレンダー連携）を開く</li>
              <li><strong>当サイト予約のエクスポート</strong> の URL をコピー</li>
              <li>Beds24 管理画面にログイン</li>
              <li><strong>プロパティ</strong> → 該当プロパティ → <strong>カレンダー</strong> → <strong>カレンダー取り込み（iCal Import）</strong></li>
              <li>コピーした URL を追加して保存</li>
            </ol>
            <p className="text-minbak-caption text-minbak-gray">
              → 当サイトで予約が入ると、Beds24 側のカレンダーに反映され、Airbnb・Booking.com などにもブロックされます。
            </p>
          </section>

          <section className="space-y-6 mb-10">
            <h2 className="text-minbak-h3 font-semibold text-minbak-black">
              ステップ2: Beds24 の予約を当サイトに反映する
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-minbak-body text-minbak-gray">
              <li>Beds24 管理画面 → <strong>プロパティ</strong> → 該当プロパティ → <strong>カレンダー</strong> → <strong>カレンダーエクスポート（iCal Export）</strong></li>
              <li>表示された <strong>Export URL</strong> をコピー</li>
              <li>当サイトの <strong>숙소 수정</strong> → <strong>캘린더 연동</strong> → <strong>外部カレンダー取り込み（Import）</strong> 欄を開く</li>
              <li>コピーした URL を 1 行に 1 つずつ貼り付け</li>
              <li><strong>저장</strong>（保存）ボタンを押す</li>
            </ol>
            <p className="text-minbak-caption text-minbak-gray">
              → Beds24（および Airbnb・Booking.com・じゃらん など）で予約が入ると、当サイトではその期間が予約不可になります。
            </p>
          </section>

          <section className="space-y-4 mb-10 p-4 border border-amber-200 bg-amber-50 rounded-minbak">
            <h3 className="text-minbak-title font-semibold text-minbak-black">注意事項</h3>
            <ul className="list-disc list-inside space-y-1 text-minbak-body text-minbak-gray">
              <li><strong>反映の遅れ</strong>: 最大 15 分程度の遅れがあります</li>
              <li><strong>価格の連携</strong>: iCal では価格は同期されません。空室（ブロック日）のみです</li>
              <li><strong>保存必須</strong>: Import URL を入力したあとは、必ず「저장」ボタンを押してください</li>
            </ul>
          </section>

          <Link
            href="/host/listings"
            className="inline-flex text-minbak-body font-medium text-minbak-primary hover:underline"
          >
            ← 宿泊施設一覧に戻る
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
