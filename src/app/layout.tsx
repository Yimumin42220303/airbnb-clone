import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import HostLocaleProvider from "@/components/host/HostLocaleProvider";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
import Toaster from "@/components/ui/Toaster";
import BottomNav from "@/components/layout/BottomNav";
import ChannelTalk from "@/components/channel/ChannelTalk";
import { BASE_URL } from "@/lib/site-url";
import { getHostLocaleFromCookie, getLocaleFromAcceptLanguage } from "@/lib/host-i18n";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1e1e" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  title: {
    default: "도쿄 숙소 예약｜에어비보다 합리적인 도쿄민박",
    template: "%s | 도쿄민박",
  },
  description:
    "에어비앤비보다 합리적인 가격으로 도쿄 숙소를 예약하세요. 문의부터 체크아웃까지 한국어로 편하게 이용할 수 있습니다.",
  openGraph: {
    url: BASE_URL,
    title: "도쿄민박 – 도쿄 숙소 예약",
    description:
      "에어비앤비보다 합리적인 가격으로 도쿄 숙소를 예약하세요. 한국어 서포트.",
    type: "website",
    locale: "ko_KR",
    siteName: "도쿄민박",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "도쿄민박 – 도쿄 숙소 예약" },
      { url: "/icon.png", width: 512, height: 512, alt: "도쿄민박" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "도쿄민박 – 도쿄 숙소 예약",
    description:
      "에어비앤비보다 합리적인 가격으로 도쿄 숙소를 예약하세요. 한국어 서포트.",
    images: ["/og-image.png", "/icon.png"],
  },
  // 네이버 서치어드바이저 사이트 소유확인
  other: {
    "naver-site-verification": "494be8c8f8bcbd6179490efcdb06e07bc5daac04",
  },
  // 모바일 웹앱: 전체화면·스탠드얼론 시 UI 모드
  appleWebApp: { capable: true, statusBarStyle: "default", title: "도쿄민박" },
  formatDetection: { telephone: false, email: false, address: false },
  // PWA: 홈 화면 추가·웹 푸시용
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const localeFromCookie = getHostLocaleFromCookie(cookieHeader);
  const hasLocaleCookie = cookieHeader.includes("host-locale=");
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const localeFromBrowser = getLocaleFromAcceptLanguage(acceptLanguage);
  const initialLocale = hasLocaleCookie ? localeFromCookie : localeFromBrowser;

  return (
    <html lang={initialLocale === "ja" ? "ja" : "ko"} className={`h-full ${notoSansKr.variable}`}>
      <body className="min-h-full antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "도쿄민박",
              url: BASE_URL,
              logo: `${BASE_URL}/icon.png`,
              description:
                "에어비앤비보다 합리적인 가격으로 도쿄 숙소를 예약할 수 있는 플랫폼. 한국인 스태프가 문의부터 체크아웃까지 한국어로 서포트합니다.",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+82-10-4689-4411",
                contactType: "customer service",
                availableLanguage: ["Korean", "Japanese"],
              },
              address: {
                "@type": "PostalAddress",
                streetAddress: "토월로 72-1",
                addressLocality: "창원시 성산구",
                addressRegion: "경상남도",
                addressCountry: "KR",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "도쿄민박",
              url: BASE_URL,
              potentialAction: {
                "@type": "SearchAction",
                target: `${BASE_URL}/search?location={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <ErrorBoundary>
          <SessionProvider>
            <CurrencyProvider>
            <HostLocaleProvider initialLocale={initialLocale}>
              <div className="pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
                {children}
              </div>
              <BottomNav />
              <ChannelTalk />
              <Toaster />
            </HostLocaleProvider>
            </CurrencyProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
