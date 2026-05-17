"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { Camera, X, Loader2 } from "lucide-react";
import { uploadImageClient, canUseClientUpload } from "@/lib/cloudinary-client-upload";

const MAX_PHOTOS = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  photos: string[];
  onChange: (urls: string[]) => void;
};

export default function ReviewPhotoUploader({ photos, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError("");

      if (!canUseClientUpload()) {
        setError("이미지 업로드 설정이 필요합니다.");
        return;
      }

      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) {
        setError(`사진은 최대 ${MAX_PHOTOS}장까지 업로드할 수 있습니다.`);
        return;
      }

      const toUpload = Array.from(files).slice(0, remaining);
      for (const f of toUpload) {
        if (!ACCEPTED_TYPES.includes(f.type)) {
          setError("JPG, PNG, WebP 형식만 지원합니다.");
          return;
        }
        if (f.size > MAX_SIZE_BYTES) {
          setError("파일 크기는 10MB 이하여야 합니다.");
          return;
        }
      }

      setUploading(true);
      try {
        const urls: string[] = [];
        for (const f of toUpload) {
          const url = await uploadImageClient(f);
          urls.push(url);
        }
        onChange([...photos, ...urls]);
      } catch {
        setError("사진 업로드에 실패했습니다. 다시 시도해 주세요.");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [photos, onChange]
  );

  const removePhoto = useCallback(
    (idx: number) => {
      onChange(photos.filter((_, i) => i !== idx));
    },
    [photos, onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#ebebeb]">
            <Image
              loader={cloudinaryLoader}
              src={url}
              alt={`업로드 사진 ${i + 1}`}
              fill
              className="object-cover"
              sizes="64px"
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-[#222] text-white text-[10px] hover:bg-red-500 transition-colors"
              aria-label="삭제"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-[#d1d1d1] hover:border-[#999] flex flex-col items-center justify-center text-[#717171] transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{photos.length}/{MAX_PHOTOS}</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
