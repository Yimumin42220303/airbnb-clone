/**
 * 숙소 이미지 업로드 훅 (클라이언트/서버 업로드 통합)
 */
import { canUseClientUpload, uploadImageClient } from "@/lib/cloudinary-client-upload";

export async function uploadListingImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  const useClientUpload = canUseClientUpload();

  if (useClientUpload) {
    for (const file of files) {
      const url = await uploadImageClient(file);
      urls.push(url);
    }
  } else {
    for (const file of files) {
      const formData = new FormData();
      formData.append("files", file);
      const uploadRes = await fetch("/api/upload/listing", {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(25000),
      });
      const text = await uploadRes.text();
      let uploadData: { urls?: string[]; error?: string };
      try {
        uploadData = text ? JSON.parse(text) : {};
      } catch {
        const friendlyMsg =
          uploadRes.status === 413
            ? "이미지가 너무 큽니다. 4MB 이하로 압축해 주세요."
            : /forbidden|403|access denied/i.test(text)
              ? "이미지 저장소 접근이 거부되었습니다. docs/Cloudinary-설정.md 에서 Upload Preset(클라이언트 업로드) 설정을 확인해 주세요."
              : `서버 오류 (${text.slice(0, 80)}...)`;
        throw new Error(friendlyMsg);
      }
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "이미지 업로드에 실패했습니다.");
      }
      const url = uploadData.urls?.[0];
      if (url) urls.push(url);
    }
  }

  return urls;
}

export function getUploadErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return /failed to fetch|network|timeout/i.test(msg)
    ? "네트워크 연결을 확인하고, 이미지를 4MB 이하로 줄인 뒤 다시 시도해 주세요."
    : msg;
}
