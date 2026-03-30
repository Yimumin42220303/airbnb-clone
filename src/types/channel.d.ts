/** 채널톡(Channel IO) 전역 타입 */
declare global {
  interface Window {
    ChannelIO?: (cmd: string, ...args: unknown[]) => void;
    ChannelIOInitialized?: boolean;
  }
}

export {};
