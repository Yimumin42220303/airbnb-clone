/** 채널톡(Channel IO) 전역 타입 */

/** 운영자용 통합 상담 맥락 — 채널톡 데스크 커스텀 프로필 필드와 동일 키 사용 */
export type TokyominbakChannelProfileFields = {
  tokyominbakContextType?: "recommendation" | "listing_inquiry" | "general";
  tokyominbakContextSummary?: string;
  tokyominbakContextDetail?: string;
  tokyominbakContextUrl?: string;
  tokyominbakLeadCode?: string;
  tokyominbakListingSummary?: string;
  tokyominbakListingIds?: string;
  tokyominbakSearchCondition?: string;
  tokyominbakContextUpdatedAt?: string;
};

export type ChannelUserProfile = TokyominbakChannelProfileFields &
  Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    ChannelIO?: (cmd: string, ...args: unknown[]) => void;
    ChannelIOInitialized?: boolean;
  }
}

export {};
