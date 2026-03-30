/**
 * Cloudinary URL 최적화 (f_auto, q_auto)
 * - f_auto: 포맷 자동 선택(WebP 등)
 * - q_auto: 품질 자동 조정
 * - w: 리사이즈 너비 (선택)
 * CDN 캐싱·모바일 데이터 절감
 */

const CLOUDINARY_UPLOAD = "/upload/";
const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * Cloudinary 이미지 URL이면 변환 파라미터 삽입, 아니면 원본 반환
 * @param url 이미지 URL (Cloudinary 또는 외부)
 * @param width 리사이즈 너비 (미지정 시 w 미적용, f_auto,q_auto만)
 */
export function optimizeCloudinaryUrl(
  url: string,
  width?: number
): string {
  if (!url || typeof url !== "string") return url;
  if (!url.includes(CLOUDINARY_HOST) || !url.includes(CLOUDINARY_UPLOAD))
    return url;
  const params = width != null ? `f_auto,q_auto,w_${width}` : "f_auto,q_auto";
  return url.replace(CLOUDINARY_UPLOAD, `${CLOUDINARY_UPLOAD}${params}/`);
}
