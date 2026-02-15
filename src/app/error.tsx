"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="text-center max-w-md">
        <p className="text-minbak-body text-minbak-gray mb-4">
          일시적인 오류가 발생했어요.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left text-xs text-red-600 mb-4 p-3 bg-red-50 rounded overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-minbak-primary text-white rounded-minbak"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
