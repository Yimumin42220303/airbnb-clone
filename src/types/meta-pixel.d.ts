/** Meta Pixel (fbq) 전역 타입 */
declare global {
  interface Window {
    fbq?: (
      command: "init" | "track" | "trackCustom",
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
    _fbq?: Window["fbq"];
    __metaPixelDebugPatched?: boolean;
  }
}

export {};
