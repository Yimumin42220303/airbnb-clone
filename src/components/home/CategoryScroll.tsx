"use client";

import { cn } from "@/lib/utils";
import { categories } from "@/lib/mock-data";

interface CategoryScrollProps {
  className?: string;
}

export default function CategoryScroll({ className }: CategoryScrollProps) {
  return (
    <div
      className={cn(
        "flex gap-8 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide",
        "scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]",
        "[&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {categories.map(({ icon, label }) => (
        <button
          key={label}
          type="button"
          className="flex flex-col items-center gap-2 flex-shrink-0 group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">
            {icon}
          </span>
          <span className="text-minbak-caption text-minbak-gray group-hover:text-minbak-black whitespace-nowrap">
            {label}
          </span>
          <span className="w-0 h-0.5 bg-minbak-black rounded-full group-hover:w-full transition-all" />
        </button>
      ))}
    </div>
  );
}
