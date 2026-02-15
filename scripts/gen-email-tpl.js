const fs = require("fs");
const p = require("path");

const K = {
  sukso: "\uC219\uC18C",
  chkIn: "\uCCB4\uD06C\uC778",
  chkOut: "\uCCB4\uD06C\uC544\uC6C3",
  guest: "\uAC8C\uC2A4\uD2B8",
  myung: "\uBA85",
  sukbak: "\uC219\uBC15",
  bak: "\uBC15",
  amount: "\uACB0\uC81C\uAE08\uC561",
  nim: "\uB2D8",
  received: "\uC608\uC57D\uC774 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
  hostWillConfirm: "\uD638\uC2A4\uD2B8\uAC00 \uC608\uC57D\uC744 \uD655\uC778\uD55C \uD6C4 \uD655\uC815 \uC548\uB0B4\uB97C \uB4DC\uB9BD\uB2C8\uB2E4.",
  myBooking: "\uB0B4 \uC608\uC57D \uD655\uC778",
  askHost: "\uAD81\uAE08\uD55C \uC810\uC740 \uBA54\uC2DC\uC9C0\uB85C \uD638\uC2A4\uD2B8\uC5D0\uAC8C \uBB38\uC758\uD574 \uC8FC\uC138\uC694.",
  brand: "\uB3C4\uCFC4\uBBFC\uBC15",
  recvSubj: "\uC608\uC57D\uC774 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
  recvTitle: "\uC608\uC57D \uC811\uC218 \uC644\uB8CC",
  newReq: "\uC0C8\uB85C\uC6B4 \uC608\uC57D \uC694\uCCAD\uC774 \uC788\uC2B5\uB2C8\uB2E4!",
  booker: "\uC608\uC57D\uC790",
  manage: "\uC608\uC57D \uAD00\uB9AC",
  fast: "\uBE60\uB978 \uC751\uB2F5\uC774 \uAC8C\uC2A4\uD2B8 \uB9CC\uC871\uB3C4\uB97C \uB192\uC785\uB2C8\uB2E4.",
  newReqTitle: "\uC0C8 \uC608\uC57D \uC694\uCCAD",
  paidDone: "\uACB0\uC81C\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
  detail: "\uC608\uC57D \uC0C1\uC138 \uBCF4\uAE30",
  chkInInfo: "\uCCB4\uD06C\uC778 \uC815\uBCF4\uB294 \uC608\uC57D \uD655\uC815 \uD6C4 \uC548\uB0B4\uB429\uB2C8\uB2E4.",
  paidTitle: "\uACB0\uC81C \uC644\uB8CC",
  confirmed: "\uC608\uC57D\uC774 \uD655\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4!",
  approved: "\uD638\uC2A4\uD2B8\uAC00 \uC608\uC57D\uC744 \uC2B9\uC778\uD588\uC2B5\uB2C8\uB2E4. \uC990\uAC70\uC6B4 \uC5EC\uD589 \uB418\uC138\uC694!",
  confirmTitle: "\uC608\uC57D \uD655\uC815",
  reason: "\uC0AC\uC720",
  rejected: "\uC548\uD0C0\uAE4D\uC9C0\uB9CC \uD638\uC2A4\uD2B8\uAC00 \uC608\uC57D\uC744 \uAC70\uC808\uD588\uC2B5\uB2C8\uB2E4.",
  searchOther: "\uB2E4\uB978 \uC219\uC18C\uB97C \uAC80\uC0C9\uD574 \uBCF4\uC138\uC694.",
  findOther: "\uB2E4\uB978 \uC219\uC18C \uCC3E\uAE30",
  rejectTitle: "\uC608\uC57D \uAC70\uC808",
  rejectSubj: "\uC608\uC57D \uAC70\uC808 \uC548\uB0B4",
  refundAmt: "\uD658\uBD88 \uAE08\uC561",
  noRefund: "\uCDE8\uC18C \uC815\uCC45\uC5D0 \uB530\uB77C \uD658\uBD88\uC774 \uBD88\uAC00\uD569\uB2C8\uB2E4.",
  cancelled: "\uC608\uC57D\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
  history: "\uC608\uC57D \uB0B4\uC5ED \uD655\uC778",
  cancelTitle: "\uC608\uC57D \uCDE8\uC18C",
  cancelSubj: "\uC608\uC57D \uCDE8\uC18C \uC548\uB0B4",
  guestCancelled: "\uAC8C\uC2A4\uD2B8\uAC00 \uC608\uC57D\uC744 \uCDE8\uC18C\uD588\uC2B5\uB2C8\uB2E4.",
  cancelledLabel: "\uC608\uC57D \uCDE8\uC18C\uB428",
};

const content = `/**
 * Email HTML templates for booking notifications.
 */

const BRAND_COLOR = "#E31C23";
const TEXT_COLOR = "#222";
const GRAY_COLOR = "#717171";
const BG_COLOR = "#f7f7f7";

function layout(title: string, body: string): string {
  return \`
<div style="background-color:\${BG_COLOR};padding:40px 0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:\${BRAND_COLOR};padding:24px 32px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
        \${title}
      </h1>
    </div>
    <div style="padding:32px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:\${TEXT_COLOR};font-size:15px;line-height:1.6;">
      \${body}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #ebebeb;text-align:center;">
      <p style="margin:0;font-size:12px;color:\${GRAY_COLOR};">
        &copy; TokyoMinbak | tokyominbak.net
      </p>
    </div>
  </div>
</div>\`;
}

function infoRow(label: string, value: string): string {
  return \`<tr>
    <td style="padding:6px 16px 6px 0;color:\${GRAY_COLOR};font-size:14px;white-space:nowrap;">\${label}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:500;">\${value}</td>
  </tr>\`;
}

function bookingTable(p: {
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
}): string {
  return \`
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  \${infoRow("${K.sukso}", p.listingTitle)}
  \${infoRow("${K.chkIn}", p.checkIn)}
  \${infoRow("${K.chkOut}", p.checkOut)}
  \${infoRow("${K.guest}", p.guests + "${K.myung}")}
  \${infoRow("${K.sukbak}", p.nights + "${K.bak}")}
  \${infoRow("${K.amount}", "\\\\u20A9" + p.totalPrice.toLocaleString())}
</table>\`;
}

function actionButton(url: string, label: string): string {
  return \`
<div style="text-align:center;margin:24px 0;">
  <a href="\${url}" style="display:inline-block;background:\${BRAND_COLOR};color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
    \${label}
  </a>
</div>\`;
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
  const body = \`
    <p>\${info.guestName}${K.nim}, ${K.received}</p>
    <p>${K.hostWillConfirm}</p>
    \${bookingTable(info)}
    \${actionButton(info.baseUrl + "/my-bookings", "${K.myBooking}")}
    <p style="font-size:13px;color:\${GRAY_COLOR};">${K.askHost}</p>\`;
  return {
    subject: "[${K.brand}] ${K.recvSubj} - " + info.listingTitle,
    html: layout("${K.recvTitle}", body),
  };
}

export function bookingNotificationHost(info: BookingEmailInfo & { hostName: string }) {
  const body = \`
    <p>\${info.hostName}${K.nim}, ${K.newReq}</p>
    \${bookingTable(info)}
    <p><strong>${K.booker}:</strong> \${info.guestName} (\${info.guestEmail})</p>
    \${actionButton(info.baseUrl + "/host/bookings", "${K.manage}")}
    <p style="font-size:13px;color:\${GRAY_COLOR};">${K.fast}</p>\`;
  return {
    subject: "[${K.brand}] ${K.newReqTitle} - " + info.listingTitle,
    html: layout("${K.newReqTitle}", body),
  };
}

export function paymentConfirmationGuest(info: BookingEmailInfo) {
  const body = \`
    <p>\${info.guestName}${K.nim}, ${K.paidDone}</p>
    <p style="font-size:18px;font-weight:700;color:\${BRAND_COLOR};">\\\\u20A9\${info.totalPrice.toLocaleString()}</p>
    \${bookingTable(info)}
    \${actionButton(info.baseUrl + "/my-bookings", "${K.detail}")}
    <p style="font-size:13px;color:\${GRAY_COLOR};">${K.chkInInfo}</p>\`;
  return {
    subject: "[${K.brand}] ${K.paidTitle} - " + info.listingTitle,
    html: layout("${K.paidTitle}", body),
  };
}

export function bookingAcceptedGuest(info: BookingEmailInfo) {
  const body = \`
    <p>\${info.guestName}${K.nim}, ${K.confirmed} \\uD83C\\uDF89</p>
    <p>${K.approved}</p>
    \${bookingTable(info)}
    \${actionButton(info.baseUrl + "/my-bookings", "${K.detail}")}\`;
  return {
    subject: "[${K.brand}] ${K.confirmTitle}! - " + info.listingTitle,
    html: layout("${K.confirmTitle}", body),
  };
}

export function bookingRejectedGuest(info: BookingEmailInfo & { reason?: string }) {
  const reasonText = info.reason
    ? \`<p><strong>${K.reason}:</strong> \${info.reason}</p>\`
    : "";
  const body = \`
    <p>\${info.guestName}${K.nim}, ${K.rejected}</p>
    \${reasonText}
    \${bookingTable(info)}
    <p>${K.searchOther}</p>
    \${actionButton(info.baseUrl + "/search", "${K.findOther}")}\`;
  return {
    subject: "[${K.brand}] ${K.rejectSubj} - " + info.listingTitle,
    html: layout("${K.rejectTitle}", body),
  };
}

export function bookingCancelledGuest(info: BookingEmailInfo & { refundAmount: number; refundPolicy: string }) {
  const refundText = info.refundAmount > 0
    ? \`<p>${K.refundAmt}: <strong>\\\\u20A9\${info.refundAmount.toLocaleString()}</strong> (\${info.refundPolicy})</p>\`
    : \`<p>${K.noRefund} (\${info.refundPolicy})</p>\`;
  const body = \`
    <p>\${info.guestName}${K.nim}, ${K.cancelled}</p>
    \${bookingTable(info)}
    \${refundText}
    \${actionButton(info.baseUrl + "/my-bookings", "${K.history}")}\`;
  return {
    subject: "[${K.brand}] ${K.cancelSubj} - " + info.listingTitle,
    html: layout("${K.cancelTitle}", body),
  };
}

export function bookingCancelledHost(info: BookingEmailInfo & { hostName: string }) {
  const body = \`
    <p>\${info.hostName}${K.nim}, ${K.guestCancelled}</p>
    \${bookingTable(info)}
    <p><strong>${K.guest}:</strong> \${info.guestName}</p>
    \${actionButton(info.baseUrl + "/host/bookings", "${K.manage}")}\`;
  return {
    subject: "[${K.brand}] ${K.cancelledLabel} - " + info.listingTitle,
    html: layout("${K.cancelledLabel}", body),
  };
}
`;

fs.writeFileSync(p.join(__dirname, "..", "src", "lib", "email-templates.ts"), content, "utf8");
console.log("Done:", content.length, "chars");