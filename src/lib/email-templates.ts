/**
 * Email HTML templates for booking notifications.
 */

const BRAND_COLOR = "#E31C23";
const TEXT_COLOR = "#222";
const GRAY_COLOR = "#717171";
const BG_COLOR = "#f7f7f7";

function layout(title: string, body: string): string {
  return `
<div style="background-color:${BG_COLOR};padding:40px 0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:${BRAND_COLOR};padding:24px 32px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
        ${title}
      </h1>
    </div>
    <div style="padding:32px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
      ${body}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #ebebeb;text-align:center;">
      <p style="margin:0;font-size:12px;color:${GRAY_COLOR};">
        &copy; TokyoMinbak | tokyominbak.net
      </p>
    </div>
  </div>
</div>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 16px 6px 0;color:${GRAY_COLOR};font-size:14px;white-space:nowrap;">${label}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

function bookingTable(p: {
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
}): string {
  return `
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  ${infoRow("숙소", p.listingTitle)}
  ${infoRow("체크인", p.checkIn)}
  ${infoRow("체크아웃", p.checkOut)}
  ${infoRow("게스트", p.guests + "명")}
  ${infoRow("숙박", p.nights + "박")}
  ${infoRow("결제금액", "\\u20A9" + p.totalPrice.toLocaleString())}
</table>`;
}

function bookingTableJa(p: {
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
}): string {
  return `
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  ${infoRow("\u5BBF\u6CCA\u65BD\u8A2D", p.listingTitle)}
  ${infoRow("\u30C1\u30A7\u30C3\u30AF\u30A4\u30F3", p.checkIn)}
  ${infoRow("\u30C1\u30A7\u30C3\u30AF\u30A2\u30A6\u30C8", p.checkOut)}
  ${infoRow("\u30B2\u30B9\u30C8", p.guests + "\u540D")}
  ${infoRow("\u5BBF\u6CCA", p.nights + "\u6CCA")}
  ${infoRow("\u5408\u8A08\u91D1\u984D", "\\u20A9" + p.totalPrice.toLocaleString())}
</table>`;
}

function actionButton(url: string, label: string): string {
  return `
<div style="text-align:center;margin:24px 0;">
  <a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
    ${label}
  </a>
</div>`;
}

export type BookingEmailInfo = {
  listingTitle: string;
  listingLocation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
  guestName: string;
  guestEmail: string;
  bookingId: string;
  baseUrl: string;
};

export function bookingConfirmationGuest(info: BookingEmailInfo) {
  const body = `
    <p>${info.guestName}님, 예약이 접수되었습니다.</p>
    <p>호스트가 예약을 확인한 후 확정 안내를 드립니다.</p>
    ${bookingTable(info)}
    ${actionButton(info.baseUrl + "/my-bookings", "내 예약 확인")}
    <p style="font-size:13px;color:${GRAY_COLOR};">궁금한 점은 메시지로 호스트에게 문의해 주세요.</p>`;
  return {
    subject: "[도쿄민박] 예약이 접수되었습니다 - " + info.listingTitle,
    html: layout("예약 접수 완료", body),
  };
}

export function bookingNotificationHost(info: BookingEmailInfo & { hostName: string }) {
  const body = `
    <p>${info.hostName}\u69D8\u3001\u65B0\u3057\u3044\u4E88\u7D04\u30EA\u30AF\u30A8\u30B9\u30C8\u304C\u5C4A\u304D\u307E\u3057\u305F\uFF01</p>
    ${bookingTableJa(info)}
    <p><strong>\u4E88\u7D04\u8005:</strong> ${info.guestName} (${info.guestEmail})</p>
    ${actionButton(info.baseUrl + "/host/bookings", "\u4E88\u7D04\u7BA1\u7406")}
    <p style="font-size:13px;color:${GRAY_COLOR};">\u8FC5\u901F\u306A\u5BFE\u5FDC\u304C\u30B2\u30B9\u30C8\u306E\u6E80\u8DB3\u5EA6\u3092\u9AD8\u3081\u307E\u3059\u3002</p>`;
  return {
    subject: "[TokyoMinbak] \u65B0\u3057\u3044\u4E88\u7D04\u30EA\u30AF\u30A8\u30B9\u30C8 - " + info.listingTitle,
    html: layout("\u65B0\u3057\u3044\u4E88\u7D04\u30EA\u30AF\u30A8\u30B9\u30C8", body),
  };
}

export function paymentConfirmationGuest(info: BookingEmailInfo) {
  const body = `
    <p>${info.guestName}님, 결제가 완료되었습니다.</p>
    <p style="font-size:18px;font-weight:700;color:${BRAND_COLOR};">\\u20A9${info.totalPrice.toLocaleString()}</p>
    ${bookingTable(info)}
    ${actionButton(info.baseUrl + "/my-bookings", "예약 상세 보기")}
    <p style="font-size:13px;color:${GRAY_COLOR};">체크인 정보는 예약 확정 후 안내됩니다.</p>`;
  return {
    subject: "[도쿄민박] 결제 완료 - " + info.listingTitle,
    html: layout("결제 완료", body),
  };
}

export function bookingAcceptedGuest(info: BookingEmailInfo) {
  const body = `
    <p>${info.guestName}님, 예약이 확정되었습니다! \uD83C\uDF89</p>
    <p>호스트가 예약을 승인했습니다. 즐거운 여행 되세요!</p>
    ${bookingTable(info)}
    ${actionButton(info.baseUrl + "/my-bookings", "예약 상세 보기")}`;
  return {
    subject: "[도쿄민박] 예약 확정! - " + info.listingTitle,
    html: layout("예약 확정", body),
  };
}

export function bookingRejectedGuest(info: BookingEmailInfo & { reason?: string }) {
  const reasonText = info.reason
    ? `<p><strong>사유:</strong> ${info.reason}</p>`
    : "";
  const body = `
    <p>${info.guestName}님, 안타깍지만 호스트가 예약을 거절했습니다.</p>
    ${reasonText}
    ${bookingTable(info)}
    <p>다른 숙소를 검색해 보세요.</p>
    ${actionButton(info.baseUrl + "/search", "다른 숙소 찾기")}`;
  return {
    subject: "[도쿄민박] 예약 거절 안내 - " + info.listingTitle,
    html: layout("예약 거절", body),
  };
}

export function bookingCancelledGuest(info: BookingEmailInfo & { refundAmount: number; refundPolicy: string }) {
  const refundText = info.refundAmount > 0
    ? `<p>환불 금액: <strong>\\u20A9${info.refundAmount.toLocaleString()}</strong> (${info.refundPolicy})</p>`
    : `<p>취소 정책에 따라 환불이 불가합니다. (${info.refundPolicy})</p>`;
  const body = `
    <p>${info.guestName}님, 예약이 취소되었습니다.</p>
    ${bookingTable(info)}
    ${refundText}
    ${actionButton(info.baseUrl + "/my-bookings", "예약 내역 확인")}`;
  return {
    subject: "[도쿄민박] 예약 취소 안내 - " + info.listingTitle,
    html: layout("예약 취소", body),
  };
}

export function paymentConfirmationHost(info: BookingEmailInfo & { hostName: string }) {
  const body = `
    <p>${info.hostName}\u69D8\u3001\u304A\u652F\u6255\u3044\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F\u3002</p>
    <p>\u4EE5\u4E0B\u306E\u4E88\u7D04\u306E\u6C7A\u6E08\u304C\u78BA\u8A8D\u3055\u308C\u307E\u3057\u305F\u3002</p>
    ${bookingTableJa(info)}
    <p><strong>\u4E88\u7D04\u8005:</strong> ${info.guestName} (${info.guestEmail})</p>
    ${actionButton(info.baseUrl + "/host/bookings", "\u4E88\u7D04\u7BA1\u7406")}`;
  return {
    subject: "[TokyoMinbak] \u6C7A\u6E08\u5B8C\u4E86 - " + info.listingTitle,
    html: layout("\u6C7A\u6E08\u5B8C\u4E86", body),
  };
}

export function bookingAcceptedHost(info: BookingEmailInfo & { hostName: string }) {
  const body = `
    <p>${info.hostName}\u69D8\u3001\u4E88\u7D04\u3092\u627F\u8A8D\u3057\u307E\u3057\u305F\u3002</p>
    <p>\u30B2\u30B9\u30C8\u306B\u78BA\u5B9A\u901A\u77E5\u304C\u9001\u4FE1\u3055\u308C\u307E\u3057\u305F\u3002</p>
    ${bookingTableJa(info)}
    <p><strong>\u4E88\u7D04\u8005:</strong> ${info.guestName} (${info.guestEmail})</p>
    ${actionButton(info.baseUrl + "/host/bookings", "\u4E88\u7D04\u7BA1\u7406")}`;
  return {
    subject: "[TokyoMinbak] \u4E88\u7D04\u627F\u8A8D\u6E08\u307F - " + info.listingTitle,
    html: layout("\u4E88\u7D04\u627F\u8A8D\u6E08\u307F", body),
  };
}

export function bookingRejectedHost(info: BookingEmailInfo & { hostName: string; reason?: string }) {
  const reasonText = info.reason
    ? `<p><strong>\u7406\u7531:</strong> ${info.reason}</p>`
    : "";
  const body = `
    <p>${info.hostName}\u69D8\u3001\u4E88\u7D04\u3092\u304A\u65AD\u308A\u3057\u307E\u3057\u305F\u3002</p>
    ${reasonText}
    ${bookingTableJa(info)}
    <p><strong>\u4E88\u7D04\u8005:</strong> ${info.guestName} (${info.guestEmail})</p>
    ${actionButton(info.baseUrl + "/host/bookings", "\u4E88\u7D04\u7BA1\u7406")}`;
  return {
    subject: "[TokyoMinbak] \u4E88\u7D04\u62D2\u5426\u6E08\u307F - " + info.listingTitle,
    html: layout("\u4E88\u7D04\u62D2\u5426\u6E08\u307F", body),
  };
}

// ========== 빌링키(카드 등록) 관련 이메일 ==========

export function billingKeyRegisteredGuest(
  info: BookingEmailInfo & { scheduledPaymentDate: string }
) {
  const body = `
    <p>${info.guestName}님, 카드 등록이 완료되었습니다.</p>
    <p>예약이 확정되었으며, 아래 예정일에 자동으로 결제됩니다.</p>
    ${bookingTable(info)}
    <div style="background:#eff6ff;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#1d4ed8;font-weight:600;">
        자동 결제 예정일: ${info.scheduledPaymentDate}
      </p>
      <p style="margin:4px 0 0;font-size:13px;color:#1d4ed8;">
        결제 예정일 전에 취소하시면 수수료 없이 전액 취소됩니다.
      </p>
    </div>
    ${actionButton(info.baseUrl + "/my-bookings", "내 예약 확인")}
    <p style="font-size:13px;color:${GRAY_COLOR};">등록하신 카드로 체크인 7일 전에 자동 결제됩니다.</p>`;
  return {
    subject: "[도쿄민박] 카드 등록 완료 - " + info.listingTitle,
    html: layout("카드 등록 완료", body),
  };
}

export function billingKeyRegisteredHost(
  info: BookingEmailInfo & { hostName: string; scheduledPaymentDate: string }
) {
  const body = `
    <p>${info.hostName}\u69D8\u3001\u65B0\u3057\u3044\u4E88\u7D04\u304C\u78BA\u5B9A\u3057\u307E\u3057\u305F\u3002</p>
    <p>\u30B2\u30B9\u30C8\u304C\u30AB\u30FC\u30C9\u3092\u767B\u9332\u3057\u307E\u3057\u305F\u3002\u6C7A\u6E08\u306F${info.scheduledPaymentDate}\u306B\u81EA\u52D5\u7684\u306B\u884C\u308F\u308C\u307E\u3059\u3002</p>
    ${bookingTableJa(info)}
    <p><strong>\u4E88\u7D04\u8005:</strong> ${info.guestName} (${info.guestEmail})</p>
    ${actionButton(info.baseUrl + "/host/bookings", "\u4E88\u7D04\u7BA1\u7406")}`;
  return {
    subject: "[TokyoMinbak] \u30AB\u30FC\u30C9\u767B\u9332\u5B8C\u4E86 - " + info.listingTitle,
    html: layout("\u30AB\u30FC\u30C9\u767B\u9332\u5B8C\u4E86", body),
  };
}

export function deferredPaymentFailedGuest(info: BookingEmailInfo) {
  const body = `
    <p>${info.guestName}님, 자동 결제에 실패했습니다.</p>
    <p>등록하신 카드로 결제를 시도했으나 처리되지 않았습니다. 아래 링크에서 결제를 다시 시도해 주세요.</p>
    ${bookingTable(info)}
    <div style="background:#fef2f2;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#dc2626;font-weight:600;">
        결제가 완료되지 않으면 예약이 취소될 수 있습니다.
      </p>
    </div>
    ${actionButton(info.baseUrl + "/booking/" + info.bookingId + "/pay", "결제하기")}
    <p style="font-size:13px;color:${GRAY_COLOR};">문제가 지속되면 다른 카드로 결제를 시도해 주세요.</p>`;
  return {
    subject: "[도쿄민박] 자동 결제 실패 - " + info.listingTitle,
    html: layout("자동 결제 실패", body),
  };
}

export function bookingCancelledHost(info: BookingEmailInfo & { hostName: string }) {
  const body = `
    <p>${info.hostName}\u69D8\u3001\u30B2\u30B9\u30C8\u304C\u4E88\u7D04\u3092\u30AD\u30E3\u30F3\u30BB\u30EB\u3057\u307E\u3057\u305F\u3002</p>
    ${bookingTableJa(info)}
    <p><strong>\u30B2\u30B9\u30C8:</strong> ${info.guestName}</p>
    ${actionButton(info.baseUrl + "/host/bookings", "\u4E88\u7D04\u7BA1\u7406")}`;
  return {
    subject: "[TokyoMinbak] \u4E88\u7D04\u30AD\u30E3\u30F3\u30BB\u30EB - " + info.listingTitle,
    html: layout("\u4E88\u7D04\u30AD\u30E3\u30F3\u30BB\u30EB", body),
  };
}
