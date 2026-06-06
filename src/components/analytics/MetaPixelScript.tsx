import { META_PIXEL_ID } from "@/lib/meta-pixel";

type Props = {
  /** 로그인 사용자 이메일 SHA-256 (Advanced Matching, 서버에서 해싱) */
  hashedEmail?: string | null;
};

/**
 * Meta Pixel fbq 스텁 초기화 — <head>에 동기 <script>로 삽입.
 *
 * PageView는 포함하지 않는다. 이유:
 * - afterInteractive 방식: fbq가 hydration 이후에 정의되어 ViewContent 등이 드롭됨
 * - 동기 script + fbq('track','PageView') 동시 호출: MetaPixelPageView 컴포넌트와 중복
 * → fbq 스텁(큐잉)만 동기 정의, PageView는 MetaPixelPageView에서 일원화.
 */
export default function MetaPixelScript({ hashedEmail }: Props) {
  const initUserData =
    hashedEmail && /^[a-f0-9]{64}$/.test(hashedEmail)
      ? `, { em: '${hashedEmail}' }`
      : "";

  const inlineScript = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}'${initUserData});
`.trim();

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
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
