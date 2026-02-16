import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.EMAIL_FROM || "TokyoMinbak <noreply@tokyominbak.net>";

/**
 * 이메일 안의 링크(결제하기, 예약 관리 등)에 사용하는 공개 URL.
 * Vercel에 NEXT_PUBLIC_APP_URL을 설정하지 않으면 VERCEL_URL(예: xxx.vercel.app)로
 * 잡혀서, 배포 보호(비밀번호)가 켜져 있으면 게스트가 링크 클릭 시 Vercel 로그인 화면이 뜹니다.
 * → Vercel 환경 변수에 NEXT_PUBLIC_APP_URL = 실제 서비스 URL(예: https://tokyominbak.net) 설정 필요.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export { BASE_URL };

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Send email via Resend.
 * Falls back to console.log in dev if RESEND_API_KEY is not set.
 * Never throws to avoid blocking main logic.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.warn(
      "[Email] RESEND_API_KEY가 설정되지 않아 메일을 보내지 않습니다. To:",
      to,
      "| Subject:",
      subject
    );
    if (process.env.NODE_ENV === "development") {
      console.log("[Email Dev] To: " + to + " | Subject: " + subject);
    }
    return;
  }

  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch (err) {
    console.error("[Email] Failed to send:", err);
  }
}

/**
 * Fire-and-forget email (does not await).
 * Use in API routes where email should not delay the response.
 */
export function sendEmailAsync(params: SendEmailParams) {
  sendEmail(params).catch((err) =>
    console.error("[Email Async] Error:", err)
  );
}