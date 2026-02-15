"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "로그인 설정이 완료되지 않았습니다. NEXTAUTH_SECRET과 OAuth 클라이언트 정보를 확인해 주세요.",
  AccessDenied: "로그인이 거부되었습니다. 권한을 허용한 뒤 다시 시도해 주세요.",
  Verification: "인증 링크가 만료되었거나 이미 사용되었습니다.",
  InvalidToken: "유효하지 않은 인증 링크입니다.",
  OAuthAccountNotLinked:
    "이 이메일로 가입된 다른 로그인 방식이 있습니다. 원래 사용하신 방식으로 로그인해 주세요.",
  OAuthCallback: "구글 로그인 처리 중 오류가 발생했습니다.",
  OAuthCreateAccount: "계정 생성 중 오류가 발생했습니다.",
  Callback: "로그인 처리 중 오류가 발생했습니다.",
  CredentialsSignin: "이메일 또는 비밀번호가 올바르지 않습니다.",
  Default: "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

type Mode = "choose" | "signup" | "login";

export default function SignInButtons({
  callbackUrl,
  errorCode,
  googleEnabled,
  kakaoEnabled,
  emailEnabled,
  verified,
}: {
  callbackUrl: string;
  errorCode: string | null;
  googleEnabled: boolean;
  kakaoEnabled: boolean;
  emailEnabled: boolean;
  verified?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const errorMessage = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? `${ERROR_MESSAGES.Default} (오류: ${errorCode})`)
    : null;

  const resetForm = () => {
    setMode("choose");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setName("");
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-[420px] bg-white rounded-[32px] shadow-minbak p-8 md:p-10">
        <h1 className="text-minbak-h2 font-semibold text-minbak-black text-center mb-2">
          도쿄민박 로그인
        </h1>
        <p className="text-minbak-body text-minbak-gray text-center mb-6">
          카카오톡 또는 구글 계정으로 간편하게 로그인/회원가입하세요.
        </p>

        {(errorMessage || verified || signupSuccess) && (
          <div
            className={`mb-6 p-3 rounded-minbak text-minbak-body ${
              errorMessage
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-green-50 border border-green-200 text-green-800"
            }`}
            role="alert"
          >
            {errorMessage || (verified && "이메일 인증이 완료되었습니다. 로그인해 주세요.") || (signupSuccess && "회원가입이 완료되었습니다. 이메일을 확인해 주세요.")}
          </div>
        )}

        <div className="space-y-3">
          {/* Kakao 로그인 */}
          <button
            type="button"
            onClick={() => {
              if (kakaoEnabled) void signIn("kakao", { callbackUrl });
            }}
            disabled={!kakaoEnabled}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[999px] text-minbak-body font-medium ${
              kakaoEnabled
                ? "bg-[#F7E600] text-black hover:bg-[#f2d900]"
                : "bg-[#F7E600]/60 text-black/50 cursor-not-allowed"
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center" aria-hidden>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#3C1E1E">
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
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[999px] border text-minbak-body font-medium ${
              googleEnabled
                ? "border-minbak-light-gray bg-white hover:bg-minbak-bg"
                : "border-minbak-light-gray/60 bg-minbak-bg cursor-not-allowed text-minbak-gray"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            구글로 계속하기
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-minbak-light-gray" />
            <span className="text-minbak-caption text-minbak-gray">혹은</span>
            <span className="h-px flex-1 bg-minbak-light-gray" />
          </div>

          {/* 이메일: 회원가입 / 로그인 */}
          {mode === "choose" && emailEnabled && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[999px] border border-minbak-light-gray bg-white hover:bg-minbak-bg text-minbak-body font-medium"
              >
                이메일로 회원가입
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[999px] border border-minbak-light-gray bg-white hover:bg-minbak-bg text-minbak-body font-medium"
              >
                이메일로 로그인
              </button>
            </div>
          )}

          {/* 회원가입 폼 */}
          {mode === "signup" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (password !== passwordConfirm) {
                  setError("비밀번호가 일치하지 않습니다.");
                  return;
                }
                if (password.length < 8) {
                  setError("비밀번호는 8자 이상이어야 합니다.");
                  return;
                }
                setLoading(true);
                try {
                  const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setError(data.error || "회원가입에 실패했습니다.");
                    setLoading(false);
                    return;
                  }
                  setSignupSuccess(true);
                  resetForm();
                } catch {
                  setError("회원가입 중 오류가 발생했습니다.");
                }
                setLoading(false);
              }}
              className="space-y-3"
            >
              {error && <p className="text-minbak-caption text-red-600" role="alert">{error}</p>}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 border border-minbak-light-gray rounded-[999px] text-minbak-body placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-black/20 disabled:opacity-50"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 (8자 이상)"
                required
                minLength={8}
                disabled={loading}
                className="w-full px-4 py-3 border border-minbak-light-gray rounded-[999px] text-minbak-body placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-black/20 disabled:opacity-50"
              />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 확인"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-minbak-light-gray rounded-[999px] text-minbak-body placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-black/20 disabled:opacity-50"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 (선택)"
                disabled={loading}
                className="w-full px-4 py-3 border border-minbak-light-gray rounded-[999px] text-minbak-body placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-black/20 disabled:opacity-50"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password || !passwordConfirm}
                  className="flex-1 py-3 rounded-[999px] bg-minbak-black text-white text-minbak-body font-medium hover:bg-minbak-black/90 disabled:opacity-50"
                >
                  {loading ? "처리 중..." : "회원가입"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-4 py-3 rounded-[999px] border border-minbak-light-gray text-minbak-body font-medium hover:bg-minbak-bg disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* 로그인 폼 */}
          {mode === "login" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);
                try {
                  const result = await signIn("credentials", {
                    email: email.trim(),
                    password,
                    callbackUrl,
                    redirect: false,
                  });
                  if (result?.error) {
                    setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.CredentialsSignin);
                    setLoading(false);
                    return;
                  }
                  if (result?.url) {
                    window.location.href = result.url;
                  } else {
                    setLoading(false);
                  }
                } catch {
                  setError(ERROR_MESSAGES.Default);
                  setLoading(false);
                }
              }}
              className="space-y-3"
            >
              {error && <p className="text-minbak-caption text-red-600" role="alert">{error}</p>}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 border border-minbak-light-gray rounded-[999px] text-minbak-body placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-black/20 disabled:opacity-50"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-minbak-light-gray rounded-[999px] text-minbak-body placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-black/20 disabled:opacity-50"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="flex-1 py-3 rounded-[999px] bg-minbak-black text-white text-minbak-body font-medium hover:bg-minbak-black/90 disabled:opacity-50"
                >
                  {loading ? "로그인 중..." : "로그인"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-4 py-3 rounded-[999px] border border-minbak-light-gray text-minbak-body font-medium hover:bg-minbak-bg disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-minbak-caption text-minbak-gray text-center mt-6">
          <Link href="/" className="hover:underline">
            홈으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
