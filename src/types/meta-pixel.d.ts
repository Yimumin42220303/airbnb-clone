/** Meta Pixel (fbq) 전역 타입 */
declare global {
  interface Window {
    fbq?: (
      command: "init" | "track" | "trackCustom",
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq?: Window["fbq"];
  }
}

export {};
