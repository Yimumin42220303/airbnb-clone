"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-minbak-body font-medium text-minbak-black mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-2.5 rounded-minbak border border-minbak-light-gray",
            "text-minbak-body text-minbak-black placeholder:text-minbak-gray",
            "focus:outline-none focus:ring-2 focus:ring-minbak-black focus:border-transparent",
            "transition-shadow",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-minbak-caption text-minbak-primary">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
