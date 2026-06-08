"use client";

import { cloneElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const errorTextClass =
  "text-[13px] text-[#D74132] mt-1 min-h-[1.25rem]";

type FormFieldWithErrorProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string; className?: string }>;
  className?: string;
};

/**
 * 라벨 + 입력 필드 + 인라인 에러 메시지.
 * error가 있으면 children에 aria-invalid, aria-describedby를 주입하고
 * 에러 문구를 role="alert"로 노출해 접근성·스타일 일관성을 맞춤.
 */
export function FormFieldWithError({
  id,
  label,
  error,
  children,
  className,
}: FormFieldWithErrorProps) {
  const hasError = !!error;
  const errorId = `${id}-error`;

  const child = cloneElement(children, {
    id,
    "aria-invalid": hasError,
    "aria-describedby": hasError ? errorId : undefined,
    className: cn(
      children.props.className,
      hasError && "border-[#D74132] focus:ring-[#D74132] focus:border-[#D74132]"
    ),
  });

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="text-[14px] font-medium text-[#222]">
        {label}
      </label>
      {child}
      {hasError && (
        <span id={errorId} className={errorTextClass} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

type FormFieldGroupErrorProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  /** 그룹 내 첫 번째 입력에 aria-describedby를 붙이려면 첫 input의 ref 대신 이 id를 전달 */
  describedById?: string;
  className?: string;
};

/**
 * 라벨 + 여러 입력(예: 전화번호 3칸) + 그룹 단위 인라인 에러.
 * describedById에 `${id}-error`를 넘기면, 그룹 내 첫 input에 aria-describedby로 연결하면 됨.
 */
export function FormFieldGroupWithError({
  id,
  label,
  error,
  children,
  className,
}: Omit<FormFieldGroupErrorProps, "describedById">) {
  const hasError = !!error;
  const errorId = `${id}-error`;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[14px] font-medium text-[#222]">{label}</span>
      {children}
      {hasError && (
        <span id={errorId} className={errorTextClass} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
