import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: "default" | "full";
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-minbak-primary text-white hover:bg-minbak-primary-hover",
  secondary: "bg-minbak-primary text-white hover:bg-minbak-primary-hover",
  ghost: "bg-transparent hover:bg-minbak-bg",
  outline: "border border-minbak-light-gray hover:border-minbak-gray",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm font-medium",
  lg: "px-6 py-3 text-base font-medium",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      rounded = "default",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          rounded === "full" ? "rounded-minbak-full" : "rounded-minbak",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
