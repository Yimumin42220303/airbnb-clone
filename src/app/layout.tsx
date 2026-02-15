import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import HostLocaleProvider from "@/components/host/HostLocaleProvider";
import Toaster from "@/components/ui/Toaster";
import BottomNav from "@/components/layout/BottomNav";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tokyominbak.example.com";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  icons: {
    icon: "/icon.svg",
  },
  title: {
    default: "도쿄 숙소 예약｜에어비보다 합리적인 도쿄민박",
    template: "%s | 도쿄민박",
  },
  description:
    "에어비앤비보다 합리적인 가격으로 도쿄 숙소를 예약하세요. 문의부터 체크아웃까지 한국어로 편하게 이용할 수 있습니다.",
  openGraph: {
    title: "도쿄민박 – 도쿄 숙소 예약",
    description:
      "에어비앤비보다 합리적인 가격으로 도쿄 숙소를 예약하세요. 한국어 서포트.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full ${notoSansKr.variable}`}>
      <body className="min-h-full antialiased font-sans">
        <ErrorBoundary>
          <SessionProvider>
            <HostLocaleProvider>
              {children}
              <BottomNav />
              <Toaster />
            </HostLocaleProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
