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

const useCloudinary =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

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

  const useBlobStorage = !!process.env.BLOB_READ_WRITE_TOKEN;
  const isVercel = !!process.env.VERCEL;
  console.log("[upload] useCloudinary:", useCloudinary, "useBlob:", useBlobStorage, "isVercel:", isVercel, "files:", valid.length);

  // Vercel에서는 Cloudinary 또는 Blob 필요
  if (!useCloudinary && !useBlobStorage && isVercel) {
    return NextResponse.json(
      {
        error:
          "이미지 저장소가 설정되지 않았습니다. Cloudinary(권장) 또는 Vercel Blob 환경 변수를 설정해 주세요. docs/Cloudinary-설정.md 참고.",
      },
      { status: 503 }
    );
  }

  try {
    if (useCloudinary) {
      // --- Cloudinary (Vercel Blob Forbidden 대안) ---
      const url = process.env.CLOUDINARY_URL;
      if (url) {
        cloudinary.config({ url });
      } else {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
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
    const isForbidden = /forbidden|403|access denied/i.test(errMsg);
    const error = isForbidden
      ? "Vercel Blob 접근 거부. Cloudinary로 전환하세요. docs/Cloudinary-설정.md 참고."
      : `이미지 업로드 중 오류: ${errMsg}`;
    return NextResponse.json({ error }, { status: 500 });
  }
}
