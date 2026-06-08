"use client";

import type { BlogCheck } from "@/lib/blog-validation";

type Props = {
  errors: BlogCheck[];
  warnings: BlogCheck[];
  info: { label: string; value: string }[];
};

export default function BlogPrePublishPanel({ errors, warnings, info }: Props) {
  const canPublish = errors.length === 0;

  return (
    <div className="rounded-minbak border border-minbak-light-gray bg-white overflow-hidden">
      <div
        className={`px-4 py-2.5 border-b border-minbak-light-gray font-medium text-minbak-body ${
          canPublish ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
        }`}
      >
        {canPublish ? "✅ 게시 가능 — 필수 항목을 모두 통과했습니다" : `❌ 게시 불가 — 오류 ${errors.length}건을 해결하세요`}
        {warnings.length > 0 && (
          <span className="ml-2 text-minbak-caption font-normal text-amber-700">
            (권장 경고 {warnings.length}건)
          </span>
        )}
      </div>

      <div className="p-4 space-y-3 text-minbak-caption">
        {info.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {info.map((i) => (
              <span
                key={i.label}
                className="px-2 py-1 rounded-full bg-minbak-bg text-minbak-gray border border-minbak-light-gray"
              >
                {i.label}: <strong className="text-minbak-black">{i.value}</strong>
              </span>
            ))}
          </div>
        )}

        {errors.length === 0 && warnings.length === 0 ? (
          <p className="text-emerald-700">✅ 모든 검사를 통과했습니다.</p>
        ) : (
          <ul className="space-y-1.5">
            {errors.map((c) => (
              <li key={c.id} className="text-red-700">
                ❌ {c.label}
              </li>
            ))}
            {warnings.map((c) => (
              <li key={c.id} className="text-amber-700">
                ⚠️ {c.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
