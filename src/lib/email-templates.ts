/**
 * Email HTML templates for booking notifications.
 */

import { formatPrice } from "@/lib/currency";

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
  ${infoRow("결제금액", formatPrice(p.totalPrice, "KRW"))}
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
  ${infoRow("\u5408\u8A08\u91D1\u984D", formatPrice(p.totalPrice, "JPY"))}
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

export function instantBookingConfirmationGuest(info: BookingEmailInfo) {
  const body = `
    <p>${info.guestName}님, 예약이 접수되었습니다.</p>
    <p><strong>내 예약</strong> 페이지에서 결제를 완료하시면 예약이 즉시 확정됩니다.</p>
    ${bookingTable(info)}
    ${actionButton(info.baseUrl + "/my-bookings", "결제하러 가기")}
    <p style="font-size:13px;color:${GRAY_COLOR};">궁금한 점은 메시지로 호스트에게 문의해 주세요.</p>`;
  return {
    subject: "[도쿄민박] 예약 접수 - 결제를 진행해주세요 - " + info.listingTitle,
    html: layout("예약 접수 · 결제 대기", body),
  };
}

export function instantBookingNotificationHost(info: BookingEmailInfo & { hostName: string }) {
  const body = `
    <p>${info.hostName}\u69D8\u3001\u65B0\u3057\u3044\u5373\u6642\u4E88\u7D04\u304C\u5C4A\u304D\u307E\u3057\u305F\uFF01</p>
    <p>\u30B2\u30B9\u30C8\u304C\u6C7A\u6E08\u3092\u5B8C\u4E86\u3059\u308B\u3068\u81EA\u52D5\u7684\u306B\u4E88\u7D04\u304C\u78BA\u5B9A\u3055\u308C\u307E\u3059\u3002</p>
    ${bookingTableJa(info)}
    <p><strong>\u4E88\u7D04\u8005:</strong> ${info.guestName} (${info.guestEmail})</p>
    ${actionButton(info.baseUrl + "/host/bookings", "\u4E88\u7D04\u7BA1\u7406")}`;
  return {
    subject: "[TokyoMinbak] \u5373\u6642\u4E88\u7D04 - " + info.listingTitle,
    html: layout("\u5373\u6642\u4E88\u7D04", body),
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
    <p style="font-size:18px;font-weight:700;color:${BRAND_COLOR};">${formatPrice(info.totalPrice, "KRW")}</p>
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

export function paymentRequestGuest(info: BookingEmailInfo) {
  const body = `
    <p>${info.guestName}님, 호스트가 예약을 승인했습니다! \uD83C\uDF89</p>
    <p><strong>내 예약</strong> 페이지에서 <strong>48시간(2일) 이내에 결제하기</strong> 버튼을 눌러 결제를 완료해 주세요.</p>
    <p>결제가 완료되면 예약이 최종 확정됩니다.</p>
    ${bookingTable(info)}
    <div style="background:#eff6ff;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#1d4ed8;font-weight:600;">
        48시간(2일) 이내에 결제하지 않으면 예약이 자동 취소됩니다.
      </p>
    </div>
    ${actionButton(info.baseUrl + "/my-bookings", "내 예약 보기")}
    <p style="font-size:13px;color:${GRAY_COLOR};">내 예약 페이지에서 해당 예약의 <strong>결제하기</strong> 버튼을 눌러 주세요. 결제 관련 문의는 메시지로 호스트에게 연락해 주세요.</p>`;
  return {
    subject: "[도쿄민박] 호스트 승인 완료 - 결제를 진행해주세요 - " + info.listingTitle,
    html: layout("호스트 승인 완료", body),
  };
}

export function paymentRequestHost(info: BookingEmailInfo & { hostName: string }) {
  const body = `
    <p>${info.hostName}\u69D8\u3001\u4E88\u7D04\u3092\u627F\u8A8D\u3057\u307E\u3057\u305F\u3002</p>
    <p>\u30B2\u30B9\u30C8\u306B\u6C7A\u6E08\u30EA\u30AF\u30A8\u30B9\u30C8\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F\u3002\u30B2\u30B9\u30C8\u304C48\u6642\u9593\uFF082\u65E5\u9593\uFF09\u4EE5\u5185\u306B\u6C7A\u6E08\u3092\u5B8C\u4E86\u3059\u308B\u3068\u3001\u4E88\u7D04\u304C\u78BA\u5B9A\u3057\u307E\u3059\u3002</p>
    ${bookingTableJa(info)}
    <p><strong>\u4E88\u7D04\u8005:</strong> ${info.guestName} (${info.guestEmail})</p>
    ${actionButton(info.baseUrl + "/host/bookings", "\u4E88\u7D04\u7BA1\u7406")}`;
  return {
    subject: "[TokyoMinbak] \u4E88\u7D04\u627F\u8A8D\u6E08\u307F\u30FB\u6C7A\u6E08\u5F85\u3061 - " + info.listingTitle,
    html: layout("\u4E88\u7D04\u627F\u8A8D\u6E08\u307F", body),
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
    ? `<p>환불 금액: <strong>${formatPrice(info.refundAmount, "KRW")}</strong> (${info.refundPolicy})</p>`
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

export function paymentReminderGuest(info: BookingEmailInfo & { deadlineText: string }) {
  const body = `
    <p>${info.guestName}님, 결제 기한이 얼마 남지 않았습니다.</p>
    <p>호스트가 승인한 예약의 결제 기한이 <strong>${info.deadlineText}</strong>까지입니다.</p>
    ${bookingTable(info)}
    <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">
        기한 내 결제하지 않으면 예약이 자동 취소됩니다.
      </p>
    </div>
    ${actionButton(info.baseUrl + "/booking/" + info.bookingId + "/pay", "지금 결제하기")}`;
  return {
    subject: "[도쿄민박] 결제 기한 임박 - " + info.listingTitle,
    html: layout("결제 기한 임박", body),
  };
}

export function instantPaymentReminderGuest(info: BookingEmailInfo & { deadlineText: string }) {
  const body = `
    <p>${info.guestName}님, 결제 기한이 얼마 남지 않았습니다.</p>
    <p>예약의 결제 기한이 <strong>${info.deadlineText}</strong>까지입니다.</p>
    ${bookingTable(info)}
    <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">
        기한 내 결제하지 않으면 예약이 자동 취소됩니다.
      </p>
    </div>
    ${actionButton(info.baseUrl + "/booking/" + info.bookingId + "/pay", "지금 결제하기")}`;
  return {
    subject: "[도쿄민박] 결제 기한 임박 - " + info.listingTitle,
    html: layout("결제 기한 임박", body),
  };
}

export function unpaidAutoCancelGuest(info: BookingEmailInfo & { deadlineLabel?: string }) {
  const label = info.deadlineLabel || "48시간";
  const body = `
    <p>${info.guestName}님, 결제 기한(${label})이 만료되어 예약이 자동 취소되었습니다.</p>
    ${bookingTable(info)}
    <p>같은 숙소를 다시 예약하시려면 아래 버튼을 눌러 주세요.</p>
    ${actionButton(info.baseUrl + "/search", "다른 숙소 찾기")}
    <p style="font-size:13px;color:${GRAY_COLOR};">궁금한 점은 메시지로 문의해 주세요.</p>`;
  return {
    subject: "[도쿄민박] 미결제 자동 취소 - " + info.listingTitle,
    html: layout("예약 자동 취소", body),
  };
}

const DEADLINE_LABEL_JA: Record<string, string> = {
  "1시간": "1時間",
  "24시간": "24時間",
  "48시간": "48時間",
};

export function unpaidAutoCancelHost(info: BookingEmailInfo & { hostName: string; deadlineLabel?: string }) {
  const koLabel = info.deadlineLabel || "48시간";
  const label = DEADLINE_LABEL_JA[koLabel] ?? "48時間";
  const body = `
    <p>${info.hostName}様、ゲストが${label}以内に決済を完了しなかったため、予約が自動キャンセルされました。</p>
    <p>該当日程に新しい予約を受け付けることができます。</p>
    ${bookingTableJa(info)}
    <p><strong>ゲスト:</strong> ${info.guestName}</p>
    ${actionButton(info.baseUrl + "/host/bookings", "予約管理")}`;
  return {
    subject: "[TokyoMinbak] 未決済自動キャンセル - " + info.listingTitle,
    html: layout("未決済自動キャンセル", body),
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

/** 체크아웃 D+1 리뷰 요청 (게스트) */
export type ReviewRequestEmailInfo = {
  guestName: string;
  listingTitle: string;
  baseUrl: string;
  listingId: string;
};

export function reviewRequestGuest(info: ReviewRequestEmailInfo) {
  const reviewUrl = `${info.baseUrl}/listing/${info.listingId}#review`;
  const body = `
    <p>${info.guestName}님, 최근 숙박하신 <strong>${info.listingTitle}</strong>은 어떠셨나요?</p>
    <p>다른 게스트를 위해 평점과 리뷰를 남겨 주시면 큰 도움이 됩니다.</p>
    ${actionButton(reviewUrl, "리뷰 작성하기")}
    <p style="font-size:13px;color:${GRAY_COLOR};">내 예약에서도 리뷰 작성이 가능합니다.</p>`;
  return {
    subject: "[도쿄민박] " + info.listingTitle + " 리뷰를 남겨 주세요",
    html: layout("숙소 리뷰를 남겨 주세요", body),
  };
}

export type RecommendationLeadEmailInfo = {
  leadCode: string;
  leadId: string;
  checkIn: string;
  checkOut: string;
  adultCount: number;
  childCount: number;
  infantCount: number;
  tripType: string | null;
  accessibilityLabel: string;
  budgetLabel: string;
  priorities: string | null;
  contactMethod: string;
  guestName: string | null;
  email: string | null;
  kakaoId: string | null;
  freeText: string | null;
  listingLines: string;
  sourcePage: string | null;
  sourceListingId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
};

function esc(s: string | null | undefined): string {
  if (!s) return "—";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function recommendationLeadNotifyEmail(info: RecommendationLeadEmailInfo): string {
  let prioritiesText = "—";
  if (info.priorities) {
    try {
      prioritiesText = (JSON.parse(info.priorities) as string[]).join(", ");
    } catch {
      prioritiesText = info.priorities;
    }
  }

  const body = `
    <p><strong>상담번호:</strong> ${esc(info.leadCode)}</p>
    <p style="font-size:13px;color:${GRAY_COLOR};">리드 ID: ${esc(info.leadId)}</p>
    <hr style="border:none;border-top:1px solid #ebebeb;margin:16px 0;" />
    <p><strong>일정:</strong> ${esc(info.checkIn)} ~ ${esc(info.checkOut)}</p>
    <p><strong>인원:</strong> 성인 ${info.adultCount}${info.childCount > 0 ? `, 아동 ${info.childCount}` : ""}${info.infantCount > 0 ? `, 유아 ${info.infantCount}` : ""}</p>
    <p><strong>여행 유형:</strong> ${esc(info.tripType)}</p>
    <p><strong>희망 지역/접근성:</strong> ${esc(info.accessibilityLabel)}</p>
    <p><strong>예산(참고):</strong> ${esc(info.budgetLabel)}</p>
    <p><strong>중요 조건:</strong> ${esc(prioritiesText)}</p>
    <p><strong>연락 방법:</strong> ${esc(info.contactMethod)}</p>
    <p><strong>이름:</strong> ${esc(info.guestName)}</p>
    <p><strong>이메일:</strong> ${esc(info.email)}</p>
    <p><strong>카카오 ID:</strong> ${esc(info.kakaoId)}</p>
    <p><strong>추천 숙소:</strong><br/>${info.listingLines || "—"}</p>
    <p><strong>추가 요청:</strong> ${esc(info.freeText)}</p>
    <hr style="border:none;border-top:1px solid #ebebeb;margin:16px 0;" />
    <p><strong>유입:</strong> ${esc(info.sourcePage)} ${info.sourceListingId ? `(listing: ${esc(info.sourceListingId)})` : ""}</p>
    <p><strong>UTM:</strong> ${esc(info.utmSource)} / ${esc(info.utmMedium)} / ${esc(info.utmCampaign)}</p>
    <p><strong>Referrer:</strong> ${esc(info.referrer?.slice(0, 200))}</p>`;

  return layout("숙소추천 상담 요청", body);
}
