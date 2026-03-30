import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatPrice } from "@/lib/currency";

/** className 병합 유틸 (Tailwind 충돌 시 후순위 적용) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 숫자 → 통화 기호 포함 포맷 (원화) */
export function formatCurrency(amount: number): string {
  return formatPrice(amount, "KRW");
}
