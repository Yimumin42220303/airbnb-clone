const fs = require("fs");
const path = require("path");

// Korean strings as unicode escapes to avoid encoding issues
const KO = {
  sukso: "\uC219\uC18C",
  checkIn: "\uCCB4\uD06C\uC778",
  checkOut: "\uCCB4\uD06C\uC544\uC6C3",
  guest: "\uAC8C\uC2A4\uD2B8",
  myung: "\uBA85",
  sukbak: "\uC219\uBC15",
  bak: "\uBC15",
  gyuljeGumek: "\uACB0\uC81C\uAE08\uC561",
  nim: "\uB2D8",
  yeyakJeopsu: "\uC608\uC57D\uC774 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
  hostConfirm: "\uD638\uC2A4\uD2B8\uAC00 \uC608\uC57D\uC744 \uD655\uC778\uD55C \uD6C4 \uD655\uC815 \uC548\uB0B4\uB97C \uB4DC\uB9BD\uB2C8\uB2E4.",
  myBooking: "\uB0B4 \uC608\uC57D \uD655\uC778",
  askHost: "\uAD81\uAE08\uD55C \uC810\uC740 \uBA54\uC2DC\uC9C0\uB85C \uD638\uC2A4\uD2B8\uC5D0\uAC8C \uBB38\uC758\uD574 \uC8FC\uC138\uC694.",
  dokyoMinbak: "\uB3C4\uCFC4\uBBFC\uBC15",
  yeyakJeopsuSubj: "\uC608\uC57D\uC774 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
  yeyakJeopsuWanryo: "\uC608\uC57D \uC811\uC218 \uC644\uB8CC",
  newYeyak: "\uC0C8\uB85C\uC6B4 \uC608\uC57D \uC694\uCCAD\uC774 \uC788\uC2B5\uB2C8\uB2E4!",
  yeyakja: "\uC608\uC57D\uC790",
  yeyakGwanri: "\uC608\uC57D \uAD00\uB9AC",
  fastResponse: "\uBE60\uB978 \uC751\uB2F5\uC774 \uAC8C\uC2A4\uD2B8 \uB9CC\uC871\uB3C4\uB97C \uB192\uC785\uB2C8\uB2E4.",
  newYeyakReq: "\uC0C8 \uC608\uC57D \uC694\uCCAD",
  paymentDone: "\uACB0\uC81C\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
  yeyakDetail: "\uC608\uC57D \uC0C1\uC138 \uBCF4\uAE30",
  checkInInfo: "\uCCB4\uD06C\uC778 \uC815\uBCF4\uB294 \uC608\uC57D \uD655\uC815 \uD6C4 \uC548\uB0B4\uB429\uB2C8\uB2E4.",
  paymentComplete: "\uACB0\uC81C \uC644\uB8CC",
  yeyakConfirmed: "\uC608\uC57D\uC774 \uD655\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4!",
  hostApproved: "\uD638\uC2A4\uD2B8\uAC00 \uC608\uC57D\uC744 \uC2B9\uC778\uD588\uC2B5\uB2C8\uB2E4. \uC990\uAC70\uC6B4 \uC5EC\uD589 \uB418\uC138\uC694!",
  yeyakHwakjeong: "\uC608\uC57D \uD655\uC815",
  sayu: "\uC0AC\uC720",
  hostRejected: "\uC548\uD0C0\uAE4D\uC9C0\uB9CC \uD638\uC2A4\uD2B8\uAC00 \uC608\uC57D\uC744 \uAC70\uC808\uD588\uC2B5\uB2C8\uB2E4.",
  searchOther: "\uB2E4\uB978 \uC219\uC18C\uB97C \uAC80\uC0C9\uD574 \uBCF4\uC138\uC694.",
  findOther: "\uB2E4\uB978 \uC219\uC18C \uCC3E\uAE30",
  yeyakReject: "\uC608\uC57D \uAC70\uC808",
  yeyakRejectSubj: "\uC608\uC57D \uAC70\uC808 \uC548\uB0B4",
  hwanbul: "\uD658\uBD88 \uAE08\uC561",
  cancelNoRefund: "\uCDE8\uC18C \uC815\uCC45\uC5D0 \uB530\uB77C \uD658\uBD88\uC774 \uBD88\uAC00\uD569\uB2C8\uB2E4.",
  yeyakCancelled: "\uC608\uC57D\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
  yeyakHistory: "\uC608\uC57D \uB0B4\uC5ED \uD655\uC778",
  yeyakCancel: "\uC608\uC57D \uCDE8\uC18C",
  yeyakCancelSubj: "\uC608\uC57D \uCDE8\uC18C \uC548\uB0B4",
  guestCancelled: "\uAC8C\uC2A4\uD2B8\uAC00 \uC608\uC57D\uC744 \uCDE8\uC18C\uD588\uC2B5\uB2C8\uB2E4.",
  yeyakCancelledLabel: "\uC608\uC57D \uCDE8\uC18C\uB428",
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
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        \${title}
      </h1>
    </div>
    <div style="padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:\${TEXT_COLOR};font-size:15px;line-height:1.6;">
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
  \${infoRow("${KO.sukso}", p.listingTitle)}
  \${infoRow("${KO.checkIn}", p.checkIn)}
  \${infoRow("${KO.checkOut}", p.checkOut)}
  \${infoRow("${KO.guest}", p.guests + "${KO.myung}")}
  \${infoRow("${KO.sukbak}", p.nights + "${KO.bak}")}
  \${infoRow("${KO.gyuljeGumek}", "\\u20A9" + p.totalPrice.toLocaleString())}
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

// ===== Booking Info Type =====
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

// ===== 1. New Booking: Guest =====
export function bookingConfirmationGuest(info: BookingEmailInfo) {
  const body = \`
    <p>\${info.guestName}${KO.nim}, ${KO.yeyakJeopsu}</p>
    <p>${KO.hostConfirm}</p>
    \${bookingTable(info)}
    \${actionButton(info.baseUrl + "/my-bookings", "${KO.myBooking}")}
    <p style="font-size:13px;color:\${GRAY_COLOR};">${KO.askHost}</p>\`;
  return {
    subject: "[${KO.dokyoMinbak}] ${KO.yeyakJeopsuSubj} - " + info.listingTitle,
    html: layout("${KO.yeyakJeopsuWanryo}", body),
  };
}

// ===== 2. New Booking: Host =====
export function bookingNotificationHost(info: BookingEmailInfo & { hostName: string }) {
  const body = \`
    <p>\${info.hostName}${KO.nim}, ${KO.newYeyak}</p>
    \${bookingTable(info)}
    <p><strong>${KO.yeyakja}:</strong> \${info.guestName} (\${info.guestEmail})</p>
    \${actionButton(info.baseUrl + "/host/bookings", "${KO.yeyakGwanri}")}
    <p style="font-size:13px;color:\${GRAY_COLOR};">${KO.fastResponse}</p>\`;
  return {
    subject: "[${KO.dokyoMinbak}] ${KO.newYeyakReq} - " + info.listingTitle,
    html: layout("${KO.newYeyakReq}", body),
  };
}

// ===== 3. Payment Completed: Guest =====
export function paymentConfirmationGuest(info: BookingEmailInfo) {
  const body = \`
    <p>\${info.guestName}${KO.nim}, ${KO.paymentDone}</p>
    <p style="font-size:18px;font-weight:700;color:\${BRAND_COLOR};">\\u20A9\${info.totalPrice.toLocaleString()}</p>
    \${bookingTable(info)}
    \${actionButton(info.baseUrl + "/my-bookings", "${KO.yeyakDetail}")}
    <p style="font-size:13px;color:\${GRAY_COLOR};">${KO.checkInInfo}</p>\`;
  return {
    subject: "[${KO.dokyoMinbak}] ${KO.paymentComplete} - " + info.listingTitle,
    html: layout("${KO.paymentComplete}", body),
  };
}

// ===== 4. Host Accepted: Guest =====
export function bookingAcceptedGuest(info: BookingEmailInfo) {
  const body = \`
    <p>\${info.guestName}${KO.nim}, ${KO.yeyakConfirmed} \\uD83C\\uDF89</p>
    <p>${KO.hostApproved}</p>
    \${bookingTable(info)}
    \${actionButton(info.baseUrl + "/my-bookings", "${KO.yeyakDetail}")}\`;
  return {
    subject: "[${KO.dokyoMinbak}] ${KO.yeyakHwakjeong}! - " + info.listingTitle,
    html: layout("${KO.yeyakHwakjeong}", body),
  };
}

// ===== 5. Host Rejected: Guest =====
export function bookingRejectedGuest(info: BookingEmailInfo & { reason?: string }) {
  const reasonText = info.reason
    ? \`<p><strong>${KO.sayu}:</strong> \${info.reason}</p>\`
    : "";
  const body = \`
    <p>\${info.guestName}${KO.nim}, ${KO.hostRejected}</p>
    \${reasonText}
    \${bookingTable(info)}
    <p>${KO.searchOther}</p>
    \${actionButton(info.baseUrl + "/search", "${KO.findOther}")}\`;
  return {
    subject: "[${KO.dokyoMinbak}] ${KO.yeyakRejectSubj} - " + info.listingTitle,
    html: layout("${KO.yeyakReject}", body),
  };
}

// ===== 6. Booking Cancelled: Guest =====
export function bookingCancelledGuest(info: BookingEmailInfo & { refundAmount: number; refundPolicy: string }) {
  const refundText = info.refundAmount > 0
    ? \`<p>${KO.hwanbul}: <strong>\\u20A9\${info.refundAmount.toLocaleString()}</strong> (\${info.refundPolicy})</p>\`
    : \`<p>${KO.cancelNoRefund} (\${info.refundPolicy})</p>\`;
  const body = \`
    <p>\${info.guestName}${KO.nim}, ${KO.yeyakCancelled}</p>
    \${bookingTable(info)}
    \${refundText}
    \${actionButton(info.baseUrl + "/my-bookings", "${KO.yeyakHistory}")}\`;
  return {
    subject: "[${KO.dokyoMinbak}] ${KO.yeyakCancelSubj} - " + info.listingTitle,
    html: layout("${KO.yeyakCancel}", body),
  };
}

// ===== 7. Booking Cancelled: Host =====
export function bookingCancelledHost(info: BookingEmailInfo & { hostName: string }) {
  const body = \`
    <p>\${info.hostName}${KO.nim}, ${KO.guestCancelled}</p>
    \${bookingTable(info)}
    <p><strong>${KO.guest}:</strong> \${info.guestName}</p>
    \${actionButton(info.baseUrl + "/host/bookings", "${KO.yeyakGwanri}")}\`;
  return {
    subject: "[${KO.dokyoMinbak}] ${KO.yeyakCancelledLabel} - " + info.listingTitle,
    html: layout("${KO.yeyakCancelledLabel}", body),
  };
}
`;

const targetPath = path.join(__dirname, "..", "src", "lib", "email-templates.ts");
fs.writeFileSync(targetPath, content, "utf8");
console.log("Written to:", targetPath);
console.log("Size:", fs.statSync(targetPath).size, "bytes");
