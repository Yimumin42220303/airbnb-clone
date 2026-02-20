"use client";

import type { Amenity } from "@/types";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { getAmenityLabel } from "@/lib/host-i18n";

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
  const { locale } = useHostTranslations();
  if (amenities.length === 0) return null;

  const sectionClass =
    variant === "compact"
      ? "border border-minbak-light-gray rounded-minbak bg-white p-4 space-y-3"
      : "rounded-2xl border border-minbak-light-gray bg-white p-6 md:p-8";
  const btnClass =
    variant === "compact"
      ? "px-3 py-1.5 rounded-full text-[13px] border"
      : "px-4 py-2 rounded-minbak border text-minbak-body transition-colors";

  return (
    <section className={sectionClass}>
      <h2 className="text-minbak-body font-semibold text-minbak-black">
        {title}
      </h2>
      <p className="text-minbak-caption text-minbak-gray">
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
                ? "bg-minbak-black text-white border-minbak-black"
                : variant === "compact"
                  ? "bg-white text-minbak-black border-minbak-light-gray hover:bg-minbak-bg"
                  : "border-minbak-light-gray text-minbak-black hover:bg-minbak-bg"
            }`}
          >
            {getAmenityLabel(locale, a.name)}
          </button>
        ))}
      </div>
    </section>
  );
}
