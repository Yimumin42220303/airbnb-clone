"use client";

import type { Amenity } from "@/types";

type Props = {
  amenities: Amenity[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  title?: string;
  description?: string;
  variant?: "default" | "compact";
};

export default function AmenitySelector({
  amenities,
  selectedIds,
  onToggle,
  title = "4. 편의시설",
  description = "해당하는 항목을 선택해 주세요.",
  variant = "default",
}: Props) {
  if (amenities.length === 0) return null;

  const sectionClass =
    variant === "compact"
      ? "border border-airbnb-light-gray rounded-airbnb bg-white p-4 space-y-3"
      : "rounded-2xl border border-airbnb-light-gray bg-white p-6 md:p-8";
  const btnClass =
    variant === "compact"
      ? "px-3 py-1.5 rounded-full text-[13px] border"
      : "px-4 py-2 rounded-airbnb border text-airbnb-body transition-colors";

  return (
    <section className={sectionClass}>
      <h2 className="text-airbnb-body font-semibold text-airbnb-black">
        {title}
      </h2>
      <p className="text-airbnb-caption text-airbnb-gray">
        {description}
      </p>
      <div className="flex flex-wrap gap-2">
        {amenities.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onToggle(a.id)}
            className={`${btnClass} ${
              selectedIds.includes(a.id)
                ? "bg-airbnb-black text-white border-airbnb-black"
                : variant === "compact"
                  ? "bg-white text-airbnb-black border-airbnb-light-gray hover:bg-airbnb-bg"
                  : "border-airbnb-light-gray text-airbnb-black hover:bg-airbnb-bg"
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>
    </section>
  );
}
