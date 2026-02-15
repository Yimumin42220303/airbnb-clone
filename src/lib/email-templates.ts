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
    <p>${info.hostName}님, 새로운 예약 요청이 있습니다!</p>
    ${bookingTable(info)}
    <p><strong>예약자:</strong> ${info.guestName} (${info.guestEmail})</p>
    ${actionButton(info.baseUrl + "/host/bookings", "예약 관리")}
    <p style="font-size:13px;color:${GRAY_COLOR};">빠른 응답이 게스트 만족도를 높입니다.</p>`;
  return {
    subject: "[도쿄민박] 새 예약 요청 - " + info.listingTitle,
    html: layout("새 예약 요청", body),
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

export function bookingCancelledHost(info: BookingEmailInfo & { hostName: string }) {
  const body = `
    <p>${info.hostName}님, 게스트가 예약을 취소했습니다.</p>
    ${bookingTable(info)}
    <p><strong>게스트:</strong> ${info.guestName}</p>
    ${actionButton(info.baseUrl + "/host/bookings", "예약 관리")}`;
  return {
    subject: "[도쿄민박] 예약 취소됨 - " + info.listingTitle,
    html: layout("예약 취소됨", body),
  };
}
