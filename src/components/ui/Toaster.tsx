"use client";
import { Toaster as SonnerToaster } from "sonner";

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        style: {
          fontFamily: "var(--font-noto-sans-kr), sans-serif",
        },
      }}
      richColors
      closeButton
    />
  );
}
