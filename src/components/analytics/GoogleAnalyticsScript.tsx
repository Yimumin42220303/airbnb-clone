import {
  GA_MEASUREMENT_ID,
  isGoogleAnalyticsEnabled,
} from "@/lib/google-analytics";

/**
 * GA4 gtag.js. root layout <head> 맨 앞에 삽입 (Google 설치 테스트·SSR 감지용).
 * next/script afterInteractive 대신 네이티브 script로 초기 HTML에 포함.
 */
export default function GoogleAnalyticsScript() {
  if (!isGoogleAnalyticsEnabled()) return null;

  return (
    <>
      {/* Google tag (gtag.js) */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
        }}
      />
    </>
  );
}
