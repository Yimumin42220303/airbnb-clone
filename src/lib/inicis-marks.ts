/** KG이니시스 결제·에스크로 인증마크 (PortOne 경유 이니시스 PG) */
export const INICIS_MID = "MOI8774709";

export function openInicisPopup(type: "inipay" | "escrow") {
  if (typeof window === "undefined") return;
  const path = type === "inipay" ? "popup_v3.php" : "escrow_popup_v3.php";
  window.open(
    `https://mark.inicis.com/mark/${path}?mid=${INICIS_MID}`,
    "mark",
    "scrollbars=no,resizable=no,width=565,height=683"
  );
}

export const INICIS_MARK_URLS = {
  inipay: {
    sm: "https://image.inicis.com/mkt/certmark/inipay/inipay_43x43_gray.png",
    md: "https://image.inicis.com/mkt/certmark/inipay/inipay_60x60_gray.png",
  },
  escrow: {
    sm: "https://image.inicis.com/mkt/certmark/escrow/escrow_43x43_gray.png",
    md: "https://image.inicis.com/mkt/certmark/escrow/escrow_60x60_gray.png",
  },
} as const;
