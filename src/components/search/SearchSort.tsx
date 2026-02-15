"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "", label: "추천순" },
  { value: "newest", label: "최신순" },
  { value: "price_asc", label: "가격 낮은순" },
  { value: "price_desc", label: "가격 높은순" },
  { value: "rating", label: "평점순" },
] as const;

export default function SearchSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(searchParams.toString());
    const value = e.target.value;
    if (value) next.set("sort", value);
    else next.delete("sort");
    router.push(`/search?${next.toString()}`);
  }

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      className="px-3 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black bg-white focus:outline-none focus:ring-2 focus:ring-minbak-primary/30"
      aria-label="정렬"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value || "default"} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
