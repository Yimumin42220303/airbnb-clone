/**
 * 프로젝트 공통 상수
 * - 여러 컴포넌트에서 중복되던 외부 링크·이메일 등을 통합
 */

/** 카카오 채널 채팅 링크 */
export const KAKAO_LINK = "https://pf.kakao.com/_nxhNjn/chat";

/** 네이버 블로그 */
export const NAVER_BLOG_LINK = "https://blog.naver.com/tokyominbak";

/** 인스타그램 프로필 링크 */
export const INSTAGRAM_LINK = "https://www.instagram.com/tokyominbak/";

/** 스레드 프로필 링크 */
export const THREADS_LINK = "https://www.threads.com/@tokyominbak";

/** Organization JSON-LD sameAs (공식 채널만) */
export const ORGANIZATION_SAME_AS = [
  NAVER_BLOG_LINK,
  INSTAGRAM_LINK,
  THREADS_LINK,
] as const;

/** 이메일 문의 링크 */
export const CONTACT_EMAIL = "mailto:minbaktokyo@gmail.com";

/** ホスト募集LP: LINE友達追加URL（QRコードと同じリンク先） */
export const HOST_LP_LINE_ADD_URL = "https://line.me/ti/p/QdEM_viWKW";
