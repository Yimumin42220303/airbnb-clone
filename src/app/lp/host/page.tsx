import Link from "next/link";
import Image from "next/image";
import { HOST_LP_LINE_ADD_URL } from "@/lib/constants";

export const metadata = {
  title: "ホスト様募集 | 韓国人ゲスト向け販売チャネル × 韓国語対応サポート | 東京民泊",
  description:
    "東京民泊は韓国人ゲスト向けの民泊販売チャネルです。最初の予約成立まで手数料無料、代行登録サービスあり、いつでも掲載停止可。個人ホスト・管理代行会社様向けに手数料10〜20%でご案内。",
};

function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function HostLpPage() {
  return (
    <div lang="ja" className="min-h-screen bg-[#f8f7f4] text-minbak-black" style={{ lineHeight: 1.65 }}>

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[rgba(248,247,244,0.82)] border-b border-minbak-light-gray/70">
        <div className="max-w-[1160px] mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 font-extrabold tracking-tight text-[1.1rem] flex-shrink-0">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-[14px] bg-minbak-primary text-white font-extrabold text-base shadow-minbak">
              民
            </span>
            <span>東京民泊 ホスト募集</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-minbak-gray text-[0.95rem]">
            <a href="#benefits" className="hover:text-minbak-black transition-colors">メリット</a>
            <a href="#plans" className="hover:text-minbak-black transition-colors">料金プラン</a>
            <a href="#flow" className="hover:text-minbak-black transition-colors">導入の流れ</a>
            <a href="#faq" className="hover:text-minbak-black transition-colors">よくある質問</a>
          </nav>
          <a
            href={HOST_LP_LINE_ADD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#06C755] text-white text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <LineIcon className="w-5 h-5" />
            LINEで相談する
          </a>
        </div>
      </header>

      <main>

        {/* ===== HERO ===== */}
        <section className="pt-12 md:pt-14 pb-7">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-6 items-stretch">

              {/* 左: コピー */}
              <div className="bg-white/86 border border-minbak-light-gray rounded-[28px] shadow-minbak-lg p-8 md:p-11 relative overflow-hidden">
                {/* 背景グラデーション装飾 */}
                <div className="pointer-events-none absolute bottom-[-120px] right-[-80px] w-[260px] h-[260px] rounded-full bg-[radial-gradient(circle_at_center,rgba(215,65,50,0.13),transparent_68%)]" />

                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#fff8f6] text-[#c0392b] border border-[#f3d0c7] rounded-full text-[0.9rem] font-bold mb-5">
                  東京で民泊運営しているホスト向け
                </div>

                <h1 className="text-[clamp(1.8rem,3.6vw,3.4rem)] font-extrabold leading-[1.08] tracking-tight mb-4">
                  韓国人ゲスト向け販売チャネルを、<br />韓国語対応サポート付きで。
                </h1>

                <p className="text-minbak-gray text-[1.04rem] max-w-[60ch] mb-6">
                  東京民泊は、韓国人ゲスト向けの宿泊販売チャネルです。<br />
                  新しい販売先を増やしたいホスト様向けに、韓国語ゲスト対応の負担軽減まで含めてサポートします。
                </p>

                <div className="flex flex-wrap gap-2.5 mb-7">
                  {["初回予約成立まで手数料無料", "固定費なし", "独占契約なし", "Airbnb URLから相談可能"].map((t) => (
                    <span key={t} className="px-3.5 py-2.5 rounded-full bg-white border border-minbak-light-gray text-[0.93rem] text-[#433f39]">{t}</span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5">
                  <a
                    href="#cta"
                    className="inline-flex items-center justify-center px-6 py-4 rounded-[14px] bg-minbak-primary text-white font-bold text-[0.97rem] shadow-[0_14px_28px_rgba(215,65,50,0.24)] hover:bg-minbak-primary-hover hover:-translate-y-px transition-all"
                  >
                    無料で相談する
                  </a>
                  <a
                    href="#plans"
                    className="inline-flex items-center justify-center px-6 py-4 rounded-[14px] bg-white border border-minbak-light-gray text-minbak-black font-bold text-[0.97rem] hover:-translate-y-px transition-all"
                  >
                    料金プランを見る
                  </a>
                </div>

                <p className="text-minbak-gray text-[0.92rem]">
                  まずは Airbnb URL をお送りください。東京民泊との相性と、導入の流れを無料でご案内します。
                </p>
              </div>

              {/* 右: オファーカード */}
              <aside className="bg-white/86 border border-minbak-light-gray rounded-[28px] shadow-minbak-lg p-7 flex flex-col gap-5">
                {/* オファーボックス */}
                <div className="p-5 rounded-[18px] bg-gradient-to-b from-[#fff7f4] to-[#fffdfc] border border-[#f4d3cb]">
                  <div className="text-[0.84rem] text-[#c0392b] font-extrabold tracking-widest uppercase mb-2">
                    Limited offer
                  </div>
                  <h2 className="text-[1.45rem] font-bold leading-[1.22] tracking-tight mb-2">
                    最初の予約が入るまで、<br />手数料はいただきません。
                  </h2>
                  <p className="text-minbak-gray text-[0.95rem]">
                    「新しい販売チャネルを試してみたいけれど、予約が入るか不安」というホスト様向けの先行オファーです。
                  </p>
                </div>

                {/* チェックリスト */}
                <ul className="space-y-3">
                  {[
                    "韓国人ゲスト向けの販売チャネルとして掲載可能",
                    "韓国語ゲスト対応サポートプランあり",
                    "iCal / Beds24 の運用状況に応じて導入案内",
                    "ホスト側の作業は最小限に整理してご案内",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#39352f] text-[0.96rem]">
                      <span className="mt-0.5 flex-shrink-0 w-[22px] h-[22px] rounded-full bg-[#e8f6f2] text-[#0f8b6d] text-[0.78rem] font-extrabold inline-flex items-center justify-center">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={HOST_LP_LINE_ADD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-[14px] bg-[#06C755] text-white font-bold text-[0.97rem] hover:opacity-90 transition-opacity mt-auto"
                >
                  <LineIcon className="w-5 h-5" />
                  LINEで無料相談する
                </a>
              </aside>
            </div>
          </div>
        </section>

        {/* ===== BENEFITS ===== */}
        <section id="benefits" className="py-7 md:py-10">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6">
            <div className="mb-6">
              <div className="text-[#c0392b] font-extrabold text-[0.85rem] tracking-widest uppercase mb-2">Why hosts join</div>
              <h2 className="text-[clamp(1.55rem,2.8vw,2.4rem)] font-bold tracking-tight leading-[1.15] mb-2">
                東京民泊がホスト様に提供する価値
              </h2>
              <p className="text-minbak-gray">
                「新しいOTAに載せる」ではなく、韓国人ゲスト向けの販売チャネルと韓国語対応サポートを、低リスクで試せることがポイントです。
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-[18px]">
              {[
                {
                  icon: "🇰🇷",
                  title: "韓国人ゲスト向け販売チャネル",
                  body: "東京民泊は韓国人ゲストに向けた導線を持つ販売チャネルです。既存のAirbnb運営を崩さず、追加販売先として活用できます。",
                },
                {
                  icon: "💬",
                  title: "韓国語ゲスト対応の負担軽減",
                  body: "予約前質問、予約後案内、滞在中の一次対応、夜間の一次対応、クレームの一次受付まで、韓国語対応を含めてサポート可能です。",
                },
                {
                  icon: "🛟",
                  title: "低リスクでテスト可能",
                  body: "固定費なし、独占契約なし、最初の予約成立前までは手数料無料。まずは小さく試したい個人ホスト様に向いています。",
                },
              ].map((c) => (
                <article key={c.title} className="bg-white/90 border border-minbak-light-gray rounded-[20px] p-6 shadow-[0_12px_30px_rgba(28,24,20,0.05)]">
                  <div className="w-[42px] h-[42px] rounded-[12px] inline-flex items-center justify-center bg-[#fff1ed] border border-[#f3d4cb] text-[1.1rem] mb-3.5">
                    {c.icon}
                  </div>
                  <h3 className="text-[1.12rem] font-bold tracking-tight mb-2.5">{c.title}</h3>
                  <p className="text-minbak-gray text-[0.96rem]">{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FOR THESE HOSTS ===== */}
        <section className="py-7 md:py-10 bg-white border-y border-minbak-light-gray">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6">
            <div className="mb-6">
              <div className="text-[#c0392b] font-extrabold text-[0.85rem] tracking-widest uppercase mb-2">For these hosts</div>
              <h2 className="text-[clamp(1.55rem,2.8vw,2.4rem)] font-bold tracking-tight leading-[1.15] mb-2">
                このようなホスト様に向いています
              </h2>
              <p className="text-minbak-gray">
                特に、1〜3室ほどを自主管理していて、外国語対応やゲストとのやり取りに手間を感じているホスト様との相性が高いです。
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-[18px]">
              <article className="bg-white/90 border border-minbak-light-gray rounded-[20px] p-6 shadow-[0_12px_30px_rgba(28,24,20,0.05)]">
                <div className="w-[42px] h-[42px] rounded-[12px] inline-flex items-center justify-center bg-[#fff1ed] border border-[#f3d4cb] text-[1.1rem] mb-3.5">
                  🏠
                </div>
                <h3 className="text-[1.12rem] font-bold tracking-tight mb-2.5">個人ホスト様</h3>
                <ul className="pl-[18px] space-y-1 list-disc text-minbak-gray text-[0.96rem]">
                  <li>Airbnbを中心に運営している</li>
                  <li>追加の販売先を試したい</li>
                  <li>まずは小さく導入したい</li>
                </ul>
              </article>
              <article className="bg-white/90 border border-minbak-light-gray rounded-[20px] p-6 shadow-[0_12px_30px_rgba(28,24,20,0.05)]">
                <div className="w-[42px] h-[42px] rounded-[12px] inline-flex items-center justify-center bg-[#fff1ed] border border-[#f3d4cb] text-[1.1rem] mb-3.5">
                  🌐
                </div>
                <h3 className="text-[1.12rem] font-bold tracking-tight mb-2.5">外国語対応に負担を感じる方</h3>
                <ul className="pl-[18px] space-y-1 list-disc text-minbak-gray text-[0.96rem]">
                  <li>韓国人ゲストからの質問対応が不安</li>
                  <li>予約後案内のやり取りが面倒</li>
                  <li>トラブル時の一次対応を任せたい</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ===== PLANS ===== */}
        <section id="plans" className="py-7 md:py-10">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6">
            <div className="mb-6">
              <div className="text-[#c0392b] font-extrabold text-[0.85rem] tracking-widest uppercase mb-2">Plans</div>
              <h2 className="text-[clamp(1.55rem,2.8vw,2.4rem)] font-bold tracking-tight leading-[1.15] mb-2">
                料金プラン
              </h2>
              <p className="text-minbak-gray">
                まずはシンプルな2プラン。ホスト様の運用スタイルに合わせてお選びいただけます。
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-[18px]">
              {/* セルフプラン */}
              <article className="bg-white/90 border border-minbak-light-gray rounded-[20px] p-6 shadow-[0_12px_30px_rgba(28,24,20,0.05)]">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#fff3ef] text-[#c0392b] font-bold text-[0.85rem] border border-[#f2cfc6] mb-4">
                  ライトに始めたい方向け
                </div>
                <h3 className="text-[1.15rem] font-bold tracking-tight mb-1">セルフ運用プラン</h3>
                <div className="flex items-baseline gap-2 my-2.5">
                  <strong className="text-[clamp(2rem,4vw,2.6rem)] font-extrabold tracking-tight leading-none">10%</strong>
                  <span className="text-minbak-gray">/ 売上</span>
                </div>
                <p className="text-minbak-gray text-[0.95rem] mb-4">
                  東京民泊を追加販売チャネルとして利用し、ゲスト対応はホスト様ご自身で行うプランです。
                </p>
                <hr className="border-minbak-light-gray my-4" />
                <ul className="pl-[18px] space-y-1 list-disc text-minbak-gray text-[0.95rem]">
                  <li>東京民泊への掲載</li>
                  <li>予約導線の提供</li>
                  <li>基本的な導入サポート</li>
                  <li>ゲスト対応はホスト様ご自身で実施</li>
                </ul>
              </article>

              {/* サポートプラン */}
              <article className="bg-gradient-to-b from-[#fff9f6] to-white border border-[#f0b8ab] rounded-[20px] p-6 shadow-[0_12px_30px_rgba(28,24,20,0.05)]">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#fff3ef] text-[#c0392b] font-bold text-[0.85rem] border border-[#f2cfc6] mb-4">
                  ⭐ おすすめ
                </div>
                <h3 className="text-[1.15rem] font-bold tracking-tight mb-1">韓国語ゲスト対応サポートプラン</h3>
                <div className="flex items-baseline gap-2 my-2.5">
                  <strong className="text-[clamp(2rem,4vw,2.6rem)] font-extrabold tracking-tight leading-none">20%</strong>
                  <span className="text-minbak-gray">/ 売上</span>
                </div>
                <p className="text-minbak-gray text-[0.95rem] mb-4">
                  韓国語ゲスト対応の負担を軽くしたいホスト様向け。販売チャネルに加えて、一次対応までサポートします。
                </p>
                <hr className="border-[#f0b8ab] my-4" />
                <ul className="pl-[18px] space-y-1 list-disc text-minbak-gray text-[0.95rem]">
                  <li>予約前質問対応</li>
                  <li>予約後の案内送付</li>
                  <li>滞在中の一次対応</li>
                  <li>夜間の一次対応</li>
                  <li>クレームの一次受付</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ===== FLOW ===== */}
        <section id="flow" className="py-7 md:py-10 bg-white border-y border-minbak-light-gray">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6">
            <div className="mb-6">
              <div className="text-[#c0392b] font-extrabold text-[0.85rem] tracking-widest uppercase mb-2">How it works</div>
              <h2 className="text-[clamp(1.55rem,2.8vw,2.4rem)] font-bold tracking-tight leading-[1.15] mb-2">
                導入の流れ
              </h2>
              <p className="text-minbak-gray">
                最初のご相談は、Airbnb URLをお送りいただくだけでも構いません。運用状況に応じて必要事項をご案内します。
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-[18px]">
              {[
                {
                  step: 1,
                  title: "Airbnb URLを送付",
                  body: "まずは宿のURLをお送りください。東京民泊との相性や、掲載の方向性を無料で確認します。",
                },
                {
                  step: 2,
                  title: "簡易ヒアリング",
                  body: "iCal / Beds24 の利用有無、価格ポリシー、キャンセルポリシー、チェックイン方法などを確認します。",
                },
                {
                  step: 3,
                  title: "掲載準備",
                  body: "必要情報を整理し、掲載準備を進めます。ホスト様側で必要な作業もわかりやすくご案内します。",
                },
                {
                  step: 4,
                  title: "販売開始",
                  body: "販売開始後は、プランに応じてセルフ運用または韓国語ゲスト対応サポートを行います。",
                },
              ].map((s) => (
                <article key={s.step} className="bg-white/90 border border-minbak-light-gray rounded-[20px] p-6 shadow-[0_12px_30px_rgba(28,24,20,0.05)]">
                  <div className="w-[34px] h-[34px] rounded-full bg-minbak-primary text-white font-extrabold inline-flex items-center justify-center shadow-[0_10px_22px_rgba(215,65,50,0.18)] mb-3.5">
                    {s.step}
                  </div>
                  <h3 className="text-[1.12rem] font-bold tracking-tight mb-2.5">{s.title}</h3>
                  <p className="text-minbak-gray text-[0.96rem]">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 不安解消 ===== */}
        <section className="py-7 md:py-10">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6">
            <div className="mb-6">
              <div className="text-[#c0392b] font-extrabold text-[0.85rem] tracking-widest uppercase mb-2">Message</div>
              <h2 className="text-[clamp(1.55rem,2.8vw,2.4rem)] font-bold tracking-tight leading-[1.15] mb-2">
                こんな不安がある方へ
              </h2>
              <p className="text-minbak-gray">
                新しい販売チャネルは、予約が入るか、設定が複雑ではないか、トラブル時に大変ではないか。多くのホスト様が同じ不安を感じています。
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-[18px]">
              <article className="bg-white/90 border border-minbak-light-gray rounded-[20px] p-6 shadow-[0_12px_30px_rgba(28,24,20,0.05)]">
                <h3 className="text-[1.12rem] font-bold tracking-tight mb-3">予約が入るかわからない</h3>
                <p className="pl-[18px] border-l-4 border-minbak-primary text-[#413d36] text-[1rem]">
                  最初の予約が成立するまで手数料無料。まずはリスクを抑えて試せる形にしています。
                </p>
              </article>
              <article className="bg-white/90 border border-minbak-light-gray rounded-[20px] p-6 shadow-[0_12px_30px_rgba(28,24,20,0.05)]">
                <h3 className="text-[1.12rem] font-bold tracking-tight mb-3">外国語対応やトラブル対応が不安</h3>
                <p className="pl-[18px] border-l-4 border-minbak-primary text-[#413d36] text-[1rem]">
                  韓国語ゲスト対応サポートプランでは、予約前後から滞在中までの一次対応をサポートします。
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq" className="py-7 md:py-10 bg-white border-y border-minbak-light-gray">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6">
            <div className="mb-6">
              <div className="text-[#c0392b] font-extrabold text-[0.85rem] tracking-widest uppercase mb-2">FAQ</div>
              <h2 className="text-[clamp(1.55rem,2.8vw,2.4rem)] font-bold tracking-tight leading-[1.15] mb-2">
                よくある質問
              </h2>
              <p className="text-minbak-gray">ホスト様からよくいただくご質問をまとめました。</p>
            </div>
            <div className="space-y-3.5">
              {[
                {
                  q: "本当に最初の予約が入るまで手数料はかかりませんか？",
                  a: "はい。先行募集期間中は、最初の予約が成立する前までは手数料をいただきません。まずは低リスクでテストしていただくためのオファーです。",
                },
                {
                  q: "Airbnbだけで運営していますが相談できますか？",
                  a: "はい。まずはAirbnb URLをご共有ください。iCal連携や必要な確認事項を含めて、導入の流れをご案内します。",
                },
                {
                  q: "韓国語ゲスト対応サポートには何が含まれますか？",
                  a: "予約前質問、予約後案内、滞在中の一次対応、夜間の一次対応、クレームの一次受付を含みます。詳細は宿の運用状況に応じてご相談ください。",
                },
                {
                  q: "大きな運営会社ではなく、個人ホストでも大丈夫ですか？",
                  a: "むしろ個人ホスト様こそ相性が良いです。特に、1〜3室程度を自主管理していて、外国語対応や追加販路に負担を感じている方に向いています。",
                },
                {
                  q: "一方的にゲストへ返金されてしまうことはありますか？",
                  a: "いいえ。一方的な返金は行いません。トラブル発生時はホスト様に状況を確認し、双方の事情を踏まえた上で対応します。",
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="bg-white/90 border border-minbak-light-gray rounded-[18px] px-5 py-[18px] shadow-[0_8px_20px_rgba(29,29,31,0.04)] group"
                >
                  <summary className="cursor-pointer list-none font-bold flex items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span className="flex-shrink-0 text-minbak-gray text-xl leading-none group-open:rotate-45 transition-transform">＋</span>
                  </summary>
                  <p className="mt-3 text-minbak-gray text-[0.96rem]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section id="cta" className="py-8 md:py-10">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6">
            <div className="p-8 md:p-[34px] rounded-[28px] bg-gradient-to-br from-[#fef3ef] via-[#fffaf8] to-white border border-[#f3d7d0] shadow-minbak-lg grid md:grid-cols-[1fr_0.9fr] gap-6 items-center">

              {/* 左: コピー */}
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#fff8f6] text-[#c0392b] border border-[#f3d0c7] rounded-full text-[0.9rem] font-bold mb-5">
                  無料相談受付中
                </div>
                <h2 className="text-[clamp(1.7rem,2.8vw,2.4rem)] font-extrabold tracking-tight leading-[1.12] mb-3">
                  まずは、Airbnb URLをお送りください。
                </h2>
                <p className="text-minbak-gray mb-5">
                  東京民泊との相性、導入時に必要な作業、どのプランが合うかを無料でご案内します。<br />
                  「まだ掲載するか決めていない」という段階でも大丈夫です。
                </p>
                <div className="flex items-center gap-2 text-minbak-gray text-[0.9rem]">
                  <span>ご連絡の方法はXもあります：</span>
                  <a
                    href="https://x.com/RimusanOTA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-[0.85rem] font-semibold hover:opacity-80 transition-opacity"
                  >
                    <XIcon className="w-4 h-4" />
                    X（運営者）
                  </a>
                </div>
              </div>

              {/* 右: LINE相談 */}
              <div className="bg-white border border-minbak-light-gray rounded-[22px] p-6 flex flex-col items-center gap-5">
                <div className="text-center">
                  <h3 className="font-bold text-[1.05rem] mb-1">LINEで無料相談する</h3>
                  <p className="text-minbak-gray text-[0.9rem]">下のボタンから友だち追加して、メッセージをお送りください。</p>
                </div>
                <a
                  href={HOST_LP_LINE_ADD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-[14px] bg-[#06C755] text-white font-bold text-[0.97rem] hover:opacity-90 transition-opacity"
                >
                  <LineIcon className="w-5 h-5" />
                  LINEで相談する
                </a>
                <p className="text-minbak-gray text-[0.85rem] text-center">無料・いつでも掲載停止可</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 pb-12 text-minbak-gray text-[0.9rem] border-t border-minbak-light-gray bg-[#f8f7f4]">
        <div className="max-w-[1160px] mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="font-semibold text-minbak-black">© 東京民泊 Host Partners</p>
              <p>韓国人ゲスト向け販売チャネル × 韓国語ゲスト対応サポート</p>
            </div>
            <nav
              className="flex flex-col gap-2 text-[0.88rem]"
              aria-label="ホストLPフッターナビ"
            >
              <Link href="/" className="hover:text-minbak-black hover:underline">
                東京民泊トップへ
              </Link>
              <a
                href={HOST_LP_LINE_ADD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-minbak-black hover:underline"
              >
                LINEで相談する
              </a>
              <a href="#cta" className="hover:text-minbak-black hover:underline">
                掲載について問い合わせる
              </a>
              <Link href="/policy" className="hover:text-minbak-black hover:underline">
                プライバシーポリシー
              </Link>
              <Link href="/agreement" className="hover:text-minbak-black hover:underline">
                利用規約
              </Link>
            </nav>
          </div>
        </div>
      </footer>

    </div>
  );
}
