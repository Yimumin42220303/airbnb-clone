"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  variant?: "default" | "compact";
  className?: string;
}

export default function SearchBar({
  variant = "default",
  className,
}: SearchBarProps) {
  const isCompact = variant === "compact";

  return (
    <Link
      href="/search"
      className={cn(
        "flex items-center gap-3 bg-white border border-airbnb-light-gray rounded-airbnb-full transition-all hover:shadow-airbnb",
        isCompact
          ? "px-4 py-2.5 flex-1"
          : "px-6 py-4 w-full max-w-[850px] mx-auto",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-airbnb-body font-semibold text-airbnb-black border-r border-airbnb-light-gray pr-4 flex-shrink-0">
          어디로
        </span>
        <span className="text-airbnb-body text-airbnb-gray border-r border-airbnb-light-gray pr-4 flex-shrink-0">
          체크인
        </span>
        <span className="text-airbnb-body text-airbnb-gray flex-shrink-0">
          체크아웃
        </span>
        <span className="text-airbnb-body text-airbnb-gray flex-shrink-0 hidden sm:inline">
          게스트
        </span>
      </div>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-airbnb-red flex items-center justify-center">
        <Search className="w-4 h-4 text-white" />
      </div>
    </Link>
  );
}
