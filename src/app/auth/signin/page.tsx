import SignInButtons from "./SignInButtons";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const callbackUrl =
    (typeof params.callbackUrl === "string" ? params.callbackUrl : params.callbackUrl?.[0]) ??
    "/";
  const errorCode =
    typeof params.error === "string" ? params.error : params.error?.[0] ?? null;
  const verified = params.verified === "1" || params.verified?.[0] === "1";

  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const kakaoEnabled = !!(
    process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET
  );
  const emailEnabled = true;

  return (
    <SignInButtons
      callbackUrl={callbackUrl}
      errorCode={errorCode}
      googleEnabled={googleEnabled}
      kakaoEnabled={kakaoEnabled}
      emailEnabled={emailEnabled}
      verified={verified}
    />
  );
}
