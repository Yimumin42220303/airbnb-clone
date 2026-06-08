import { hashMetaUserData } from "@/lib/meta-payload-validator";

/**
 * Request 쿠키 헤더에서 _fbc, _fbp를 추출 (평문, 해싱 불필요).
 * EMQ(이벤트 매칭 품질) 향상에 중요.
 */
export function extractMetaCookies(request: Request): {
  fbc: string | undefined;
  fbp: string | undefined;
} {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k.trim(), v.join("=")];
    })
  );
  return {
    fbc: cookies["_fbc"] || undefined,
    fbp: cookies["_fbp"] || undefined,
  };
}

/**
 * Meta CAPI/Pixel Advanced Matching용 전화번호 정규화.
 * 숫자만 남기고, 한국 010은 82 국가코드 형식으로 통일.
 */
export function normalizePhoneForMeta(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("82")) return digits;
  if (digits.startsWith("0")) return `82${digits.slice(1)}`;
  return digits;
}

export function hashMetaPhone(phone: string): string {
  const normalized = normalizePhoneForMeta(phone);
  if (!normalized) return "";
  return hashMetaUserData(normalized);
}
