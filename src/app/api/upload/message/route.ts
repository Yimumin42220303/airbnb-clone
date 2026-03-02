import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { v2 as cloudinary } from "cloudinary";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
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
 * POST /api/upload/message
 * 로그인 사용자가 메시지 첨부용 이미지 1장 업로드.
 * Cloudinary > Vercel Blob > 로컬 파일시스템 순.
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

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "이미지 파일을 첨부해 주세요. (JPEG/PNG/WebP/GIF, 최대 4MB)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "파일 크기는 4MB 이하여야 합니다." },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "JPEG/PNG/WebP/GIF 이미지만 업로드할 수 있습니다." },
      { status: 400 }
    );
  }

  const useCloud = isCloudinaryEnabled();
  const useBlobStorage = !!process.env.BLOB_READ_WRITE_TOKEN;
  const isVercel = !!process.env.VERCEL;
  if (!useCloud && !useBlobStorage && isVercel) {
    return NextResponse.json(
      {
        error:
          "이미지 저장소가 설정되지 않았습니다. Cloudinary 또는 Vercel Blob 환경 변수를 설정해 주세요.",
      },
      { status: 503 }
    );
  }

  try {
    if (useCloud) {
      const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
      const key = process.env.CLOUDINARY_API_KEY?.trim();
      const secret = process.env.CLOUDINARY_API_SECRET?.trim();
      const url = process.env.CLOUDINARY_URL?.trim();
      const envUrl =
        url ||
        (cloud && key && secret ? `cloudinary://${key}:${secret}@${cloud}` : null);
      if (envUrl) {
        process.env.CLOUDINARY_URL = envUrl;
        cloudinary.config(true);
      } else {
        cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "messages", resource_type: "image" },
            (err, uploadResult) => {
              if (err) reject(err);
              else if (uploadResult) resolve(uploadResult as { secure_url: string });
              else reject(new Error("Upload failed"));
            }
          )
          .end(buf);
      });
      return NextResponse.json({ url: result.secure_url });
    }
    if (useBlobStorage) {
      const ext = getExt(file.name);
      const filename = `messages/${crypto.randomUUID()}${ext}`;
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: true,
        allowOverwrite: true,
      });
      return NextResponse.json({ url: blob.url });
    }
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads", "messages");
    await mkdir(dir, { recursive: true });
    const ext = getExt(file.name);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(dir, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buf);
    return NextResponse.json({ url: `/uploads/messages/${filename}` });
  } catch (err) {
    const errMsg =
      err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : String(err);
    console.error("[upload/message]", errMsg, err);
    return NextResponse.json(
      { error: `이미지 업로드 중 오류: ${errMsg}` },
      { status: 500 }
    );
  }
}
