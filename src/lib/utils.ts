import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** className 병합 유틸 (Tailwind 충돌 시 후순위 적용) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 숫자 → "₩12,345" 통화 포맷 */
export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString()}`;
}
