import Link from "next/link";

export default function VerifyRequestPage() {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-[420px] bg-white rounded-[32px] shadow-minbak p-8 md:p-10">
        <h1 className="text-minbak-h2 font-semibold text-minbak-black text-center mb-2">
          이메일을 확인해 주세요
        </h1>
        <p className="text-minbak-body text-minbak-gray text-center mb-6">
          입력하신 이메일 주소로 로그인 링크를 보냈습니다. 링크를 클릭하여 로그인하세요.
        </p>
        <p className="text-minbak-caption text-minbak-gray text-center mb-6">
          ※ 메일이 안보인다면 &apos;스팸함&apos;을 확인해 주세요.
        </p>
        {isDev && (
          <div
            className="mb-6 p-3 rounded-minbak bg-amber-50 border border-amber-200 text-minbak-body text-amber-800"
            role="alert"
          >
            <p className="font-medium">개발 모드</p>
            <p className="mt-1 text-minbak-caption">
              이메일이 발송되지 않습니다. 서버 콘솔(터미널)에서 로그인 링크를 확인하세요.
            </p>
          </div>
        )}
        <p className="text-minbak-caption text-minbak-gray text-center">
          <Link href="/auth/signin" className="hover:underline">
            로그인 페이지로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
