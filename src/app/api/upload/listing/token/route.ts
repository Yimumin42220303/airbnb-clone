import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

/**
 * POST /api/upload/listing/token
 * 클라이언트 사이드 Vercel Blob 업로드를 위한 토큰 발급.
 * Vercel Blob의 client upload 프로토콜을 처리합니다.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // 인증 확인
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          throw new Error("로그인 후 업로드할 수 있습니다.");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true,
          allowOverwrite: true,
          tokenPayload: JSON.stringify({
            userId: (session as { userId?: string })?.userId || session.user.email,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("[blob upload completed]", blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "업로드 토큰 발급 실패";
    console.error("Upload token error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
