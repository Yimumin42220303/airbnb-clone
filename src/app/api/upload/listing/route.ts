import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 100;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getExt(name: string): string {
  const m = name.match(/\.(jpe?g|png|webp|gif)$/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

/**
 * POST /api/upload/listing
 * 로그인 사용자가 숙소 이미지를 업로드. public/uploads/listings 에 저장 후 URL 목록 반환.
 * 배포 시 Vercel 등은 파일시스템이 휘발성이므로 S3/Cloudinary 등 외부 저장소 사용을 권장.
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
      { error: "이미지 파일을 1개 이상 첨부해 주세요. (JPEG/PNG/WebP/GIF, 최대 5MB)" },
      { status: 400 }
    );
  }
  if (valid.length > MAX_FILES) {
    return NextResponse.json(
      { error: `이미지는 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.` },
      { status: 400 }
    );
  }

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
}
