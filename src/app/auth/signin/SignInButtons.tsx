"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "로그인 설정이 완료되지 않았습니다. NEXTAUTH_SECRET과 OAuth 클라이언트 정보를 확인해 주세요.",
  AccessDenied: "로그인이 거부되었습니다. 권한을 허용한 뒤 다시 시도해 주세요.",
  Verification: "인증 링크가 만료되었거나 이미 사용되었습니다.",
  OAuthAccountNotLinked:
    "이 이메일로 가입된 다른 로그인 방식이 있습니다. 원래 사용하신 방식으로 로그인해 주세요.",
  OAuthCallback: "구글 로그인 처리 중 오류가 발생했습니다.",
  OAuthCreateAccount: "계정 생성 중 오류가 발생했습니다.",
  Callback: "로그인 처리 중 오류가 발생했습니다.",
  Default: "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

export default function SignInButtons({
  callbackUrl,
  errorCode,
  googleEnabled,
  kakaoEnabled,
  emailEnabled,
}: {
  callbackUrl: string;
  errorCode: string | null;
  googleEnabled: boolean;
  kakaoEnabled: boolean;
  emailEnabled: boolean;
}) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const errorMessage = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? `${ERROR_MESSAGES.Default} (오류: ${errorCode})`)
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-[420px] bg-white rounded-[32px] shadow-airbnb p-8 md:p-10">
        <h1 className="text-airbnb-h2 font-semibold text-airbnb-black text-center mb-2">
          도쿄민박 로그인
        </h1>
        <p className="text-airbnb-body text-airbnb-gray text-center mb-6">
          카카오톡 또는 구글 계정으로 간편하게 로그인/회원가입하세요.
        </p>

        {errorMessage && (
          <div
            className="mb-6 p-3 rounded-airbnb bg-red-50 border border-red-200 text-airbnb-body text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <div className="space-y-3">
          {/* Kakao 로그인 (UI만, 아직 비활성화) */}
          <button
            type="button"
            onClick={() => {
              if (kakaoEnabled) {
                void signIn("kakao", { callbackUrl });
              }
            }}
            disabled={!kakaoEnabled}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[999px] text-airbnb-body font-medium ${
              kakaoEnabled
                ? "bg-[#F7E600] text-black hover:bg-[#f2d900]"
                : "bg-[#F7E600]/60 text-black/50 cursor-not-allowed"
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="#3C1E1E"
              >
                <path d="M12 3.5C7.83 3.5 4.5 6.27 4.5 9.8c0 2.12 1.25 3.94 3.22 5.05L7.5 19.5l3.03-2.03c.47.07.96.1 1.47.1 4.17 0 7.5-2.77 7.5-6.3C19.5 6.27 16.17 3.5 12 3.5z" />
              </svg>
            </span>
            카카오로 계속하기
          </button>

          {/* Google 로그인 */}
          <button
            type="button"
            onClick={() => googleEnabled && signIn("google", { callbackUrl })}
            disabled={!googleEnabled}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[999px] border text-airbnb-body font-medium ${
              googleEnabled
                ? "border-airbnb-light-gray bg-white hover:bg-airbnb-bg"
                : "border-airbnb-light-gray/60 bg-airbnb-bg cursor-not-allowed text-airbnb-gray"
            }`}
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            구글로 계속하기
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-airbnb-light-gray" />
            <span className="text-airbnb-caption text-airbnb-gray">혹은</span>
            <span className="h-px flex-1 bg-airbnb-light-gray" />
          </div>

          {/* 이메일 로그인 */}
          {showEmailForm ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!email.trim() || !emailEnabled) return;
                setEmailLoading(true);
                setEmailError(null);
                try {
                  const result = await signIn("email", {
                    email: email.trim(),
                    callbackUrl,
                    redirect: false,
                  });
                  if (result?.error) {
                    setEmailError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.Default);
                    setEmailLoading(false);
                    return;
                  }
                  if (result?.url) {
                    window.location.href = result.url;
                  } else {
                    setEmailLoading(false);
                  }
                } catch {
                  setEmailError(ERROR_MESSAGES.Default);
                  setEmailLoading(false);
                }
              }}
              className="space-y-3"
            >
              {emailError && (
                <p className="text-airbnb-caption text-red-600" role="alert">
                  {emailError}
                </p>
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                autoFocus
                disabled={emailLoading}
                className="w-full px-4 py-3 border border-airbnb-light-gray rounded-[999px] text-airbnb-body placeholder:text-airbnb-gray focus:outline-none focus:ring-2 focus:ring-airbnb-black/20 disabled:opacity-50"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={emailLoading || !email.trim()}
                  className="flex-1 py-3 rounded-[999px] bg-airbnb-black text-white text-airbnb-body font-medium hover:bg-airbnb-black/90 disabled:opacity-50"
                >
                  {emailLoading ? "전송 중..." : "로그인 링크 받기"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false);
                    setEmail("");
                  }}
                  disabled={emailLoading}
                  className="px-4 py-3 rounded-[999px] border border-airbnb-light-gray text-airbnb-body font-medium hover:bg-airbnb-bg disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => emailEnabled && setShowEmailForm(true)}
              disabled={!emailEnabled}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[999px] border text-airbnb-body font-medium ${
                emailEnabled
                  ? "border-airbnb-light-gray bg-white hover:bg-airbnb-bg"
                  : "border-airbnb-light-gray/60 bg-white cursor-not-allowed text-airbnb-gray"
              }`}
            >
              이메일 주소로 로그인하기
            </button>
          )}
        </div>

        <p className="text-airbnb-caption text-airbnb-gray text-center mt-6">
          <Link href="/" className="hover:underline">
            홈으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
