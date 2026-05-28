import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

type Props = {
  /** 로그인 사용자 이메일 SHA-256 (Advanced Matching, 서버에서 해싱) */
  hashedEmail?: string | null;
};

/**
 * Meta Pixel 기본 스크립트. root layout <head>에 삽입.
 * 최초 로드 시 PageView 1회 발생.
 */
export default function MetaPixelScript({ hashedEmail }: Props) {
  const initUserData =
    hashedEmail && /^[a-f0-9]{64}$/.test(hashedEmail)
      ? `, { em: '${hashedEmail}' }`
      : "";

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}'${initUserData});
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
