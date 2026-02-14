/**
 * Cloudinary 클라이언트 직접 업로드 (unsigned preset)
 * 서버 인증 문제 없이 브라우저에서 직접 업로드
 * Cloudinary 대시보드에서 Upload Preset 생성 필요 (Signing Mode: Unsigned)
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

export function canUseClientUpload(): boolean {
  return !!(CLOUD_NAME && UPLOAD_PRESET);
}

export async function uploadImageClient(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET 필요");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "listings");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || data.error);
  }
  if (!data.secure_url) {
    throw new Error("업로드 응답에 URL이 없습니다.");
  }
  return data.secure_url;
}
