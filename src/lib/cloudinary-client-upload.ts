/**
 * Cloudinary 클라이언트 직접 업로드 (unsigned preset)
 * 서버 인증 문제 없이 브라우저에서 직접 업로드
 * Cloudinary 대시보드에서 Upload Preset 생성 필요 (Signing Mode: Unsigned)
 * 영상 업로드 시 Preset에서 Resource type: Video 또는 Auto 허용 필요
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
/** 영상 전용 preset (선택). 없으면 UPLOAD_PRESET 사용 */
const VIDEO_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_UPLOAD_PRESET?.trim();

export const LISTING_VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50MB
export const LISTING_VIDEO_ACCEPT = "video/mp4,video/webm";

export function canUseClientUpload(): boolean {
  return !!(CLOUD_NAME && UPLOAD_PRESET);
}

export function canUseVideoUpload(): boolean {
  return !!(CLOUD_NAME && (VIDEO_UPLOAD_PRESET || UPLOAD_PRESET));
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

/**
 * 숙소 소개 영상 업로드 (50MB 이하, MP4/WebM). 인스타 릴스 비율 9:16 권장.
 * Preset에서 Resource type: Video 또는 Auto 허용 필요.
 */
export async function uploadVideoClient(file: File): Promise<string> {
  return uploadVideoClientWithProgress(file, () => {});
}

/**
 * 영상 업로드 + 진행률 콜백 (0–100). XHR upload.onprogress 사용.
 */
export function uploadVideoClientWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  if (!CLOUD_NAME) {
    return Promise.reject(new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME 필요"));
  }
  const preset = VIDEO_UPLOAD_PRESET || UPLOAD_PRESET;
  if (!preset) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET 또는 NEXT_PUBLIC_CLOUDINARY_VIDEO_UPLOAD_PRESET 필요")
    );
  }
  if (file.size > LISTING_VIDEO_MAX_BYTES) {
    return Promise.reject(new Error("영상은 50MB 이하로 올려 주세요."));
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  formData.append("folder", "listings/videos");

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && e.total > 0) {
        const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
        onProgress(percent);
      } else {
        onProgress(0);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.error) {
            reject(new Error(data.error.message || data.error));
            return;
          }
          if (!data.secure_url) {
            reject(new Error("업로드 응답에 URL이 없습니다."));
            return;
          }
          onProgress(100);
          resolve(data.secure_url);
        } catch {
          reject(new Error("응답을 읽을 수 없습니다."));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error?.message || `업로드 실패 (${xhr.status})`));
        } catch {
          reject(new Error(`업로드 실패 (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("네트워크 오류로 업로드에 실패했습니다.")));
    xhr.addEventListener("abort", () => reject(new Error("업로드가 취소되었습니다.")));

    xhr.open("POST", url);
    xhr.send(formData);
  });
}
