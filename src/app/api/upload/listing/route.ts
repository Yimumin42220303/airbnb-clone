import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { v2 as cloudinary } from "cloudinary";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB (Vercel 요청 본문 4.5MB 제한 회피)
const MAX_FILES = 100;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getExt(name: string): string {
  const m = name.match(/\.(jpe?g|png|webp|gif)$/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

function isCloudinaryEnabled(): boolean {
  return !!(
    process.env.CLOUDINARY_URL?.trim() ||
    (process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim())
  );
}

export const maxDuration = 30;

/**
 * POST /api/upload/listing
 * 로그인 사용자가 숙소 이미지를 업로드.
 * Cloudinary > Vercel Blob > 로컬 파일시스템 순으로 사용.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "로그인 후 업로드할 수 있습니다." },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }

  const files = formData.getAll("files") as File[];
  const single = formData.get("file");
  const list: File[] = Array.isArray(files) && files.length > 0
    ? files
    : single instanceof File
      ? [single]
      : [];

  const valid = list.filter(
    (f) => f?.size > 0 && f.size <= MAX_SIZE && ALLOWED_TYPES.includes(f.type)
  );
  if (valid.length === 0) {
    return NextResponse.json(
      { error: "이미지 파일을 1개 이상 첨부해 주세요. (JPEG/PNG/WebP/GIF, 최대 4MB)" },
      { status: 400 }
    );
  }
  if (valid.length > MAX_FILES) {
    return NextResponse.json(
      { error: `이미지는 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.` },
      { status: 400 }
    );
  }

  const useCloud = isCloudinaryEnabled();
  const useBlobStorage = !!process.env.BLOB_READ_WRITE_TOKEN;
  const isVercel = !!process.env.VERCEL;
  // Vercel에서는 Cloudinary 또는 Blob 필요 (Cloudinary 우선)
  if (!useCloud && !useBlobStorage && isVercel) {
    return NextResponse.json(
      {
        error:
          "이미지 저장소가 설정되지 않았습니다. Cloudinary(권장) 또는 Vercel Blob 환경 변수를 설정해 주세요. docs/Cloudinary-설정.md 참고.",
      },
      { status: 503 }
    );
  }

  try {
    if (useCloud) {
      // --- Cloudinary (Vercel Blob Forbidden 대안) ---
      const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
      const key = process.env.CLOUDINARY_API_KEY?.trim();
      const secret = process.env.CLOUDINARY_API_SECRET?.trim();
      const url = process.env.CLOUDINARY_URL?.trim();
      // CLOUDINARY_URL 우선 (Invalid Signature 방지 - 대시보드에서 복사한 형식 사용)
      const envUrl = url || (cloud && key && secret ? `cloudinary://${key}:${secret}@${cloud}` : null);
      if (envUrl) {
        process.env.CLOUDINARY_URL = envUrl;
        cloudinary.config(true); // config 리셋 후 env에서 재로드
      } else {
        cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret });
      }
      const urls: string[] = [];
      for (const file of valid) {
        const buf = Buffer.from(await file.arrayBuffer());
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: "listings", resource_type: "image" },
              (err, uploadResult) => {
                if (err) reject(err);
                else if (uploadResult) resolve(uploadResult as { secure_url: string });
                else reject(new Error("Upload failed"));
              }
            )
            .end(buf);
        });
        urls.push(result.secure_url);
      }
      return NextResponse.json({ urls });
    }
    if (useBlobStorage) {
      // --- Vercel Blob ---
      const urls: string[] = [];
      for (const file of valid) {
        const ext = getExt(file.name);
        const filename = `listings/${crypto.randomUUID()}${ext}`;
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
          allowOverwrite: true,
        });
        urls.push(blob.url);
      }
      return NextResponse.json({ urls });
    }
    // --- 로컬 파일시스템 (개발용) ---
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads", "listings");
    await mkdir(dir, { recursive: true });

    const urls: string[] = [];
    for (const file of valid) {
      const ext = getExt(file.name);
      const filename = `${crypto.randomUUID()}${ext}`;
      const filepath = path.join(dir, filename);
      const buf = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buf);
      urls.push(`/uploads/listings/${filename}`);
    }
    return NextResponse.json({ urls });
  } catch (err) {
    const errMsg = (() => {
      if (err instanceof Error) return err.message;
      if (err && typeof err === "object") {
        const o = err as Record<string, unknown>;
        if (typeof o.message === "string") return o.message;
        if (o.error && typeof (o.error as Record<string, unknown>).message === "string")
          return (o.error as Record<string, unknown>).message as string;
        if (typeof o.error === "string") return o.error;
        try {
          const s = JSON.stringify(o);
          if (s && s !== "{}") return s.slice(0, 200);
        } catch {}
      }
      return String(err);
    })();
    console.error("Image upload error:", errMsg, err);
    const isForbidden = /forbidden|403|access denied|unauthorized|invalid.*signature|invalid.*cloud/i.test(errMsg);
    const error = isForbidden
      ? `저장소 접근 거부: ${errMsg}. Cloudinary 대시보드에서 API Key/Secret 확인 후 docs/Cloudinary-설정.md 참고.`
      : `이미지 업로드 중 오류: ${errMsg}`;
    return NextResponse.json({ error }, { status: 500 });
  }
}
