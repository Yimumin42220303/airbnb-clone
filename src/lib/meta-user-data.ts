import { hashMetaUserData } from "@/lib/meta-payload-validator";

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
