import Link from "next/link";

type Props = {
  callbackUrl: string;
  description: string;
};

/** 로그인 전용 페이지 공통 안내 카드 */
export default function LoginRequiredPrompt({ callbackUrl, description }: Props) {
  return (
    <div className="border border-minbak-light-gray rounded-minbak bg-white p-6 text-center max-w-md mx-auto">
      <h1 className="text-minbak-body text-minbak-black font-semibold mb-1">
        로그인이 필요한 페이지입니다
      </h1>
      <p className="text-minbak-caption text-minbak-gray mb-4">
        {description}
      </p>
      <Link
        href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white text-minbak-body font-medium hover:bg-minbak-primary-hover transition-colors"
      >
        로그인하기
      </Link>
    </div>
  );
}
