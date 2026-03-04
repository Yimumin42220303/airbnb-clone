"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
};

type Props = {
  user: UserData;
};

export default function ProfileEditForm({ user }: Props) {
  const router = useRouter();
  const { t } = useHostTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [displayImage, setDisplayImage] = useState<string | null>(user.image);
  const [imageToSave, setImageToSave] = useState<string | null | "keep">("keep");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError(t("profileEdit.photoFormatError"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t("profileEdit.photoSizeError"));
      return;
    }
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/upload/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("profileEdit.uploadFailed"));
        return;
      }
      setDisplayImage(data.url);
      setImageToSave(data.url);
    } catch {
      setError(t("profileEdit.uploadError"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleRemovePhoto() {
    setDisplayImage(null);
    setImageToSave(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: { name: string; phone: string; image?: string | null } = {
        name: name.trim(),
        phone: phone.trim(),
      };
      if (imageToSave !== "keep") body.image = imageToSave;
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("profileEdit.saveFailed"));
        return;
      }
      router.push("/mypage");
      router.refresh();
    } catch {
      setError(t("mypage.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-minbak-light-gray rounded-minbak p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-24 h-24 rounded-full bg-minbak-primary/20 flex items-center justify-center overflow-hidden">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={user.name ?? t("profileEdit.profileAlt")}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized={displayImage.startsWith("blob:") || displayImage.startsWith("/uploads/")}
                />
              ) : (
                <span className="text-3xl font-bold text-minbak-primary">
                  {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-minbak-caption font-medium text-minbak-primary hover:underline disabled:opacity-50"
              >
                {uploading ? t("profileEdit.uploading") : t("profileEdit.changePhoto")}
              </button>
              {displayImage && (
                <>
                  <span className="text-minbak-gray">·</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-minbak-caption font-medium text-minbak-gray hover:underline"
                  >
                    {t("profileEdit.removePhoto")}
                  </button>
                </>
              )}
            </div>
            <p className="text-minbak-caption text-minbak-gray text-center">
              {t("profileEdit.photoHint")}
            </p>
          </div>
          <div className="flex-1 min-w-0 space-y-4 w-full">
            <div>
              <label
                htmlFor="name"
                className="block text-minbak-caption font-medium text-minbak-black mb-1.5"
              >
                {t("mypage.userName")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profileEdit.namePlaceholder")}
                className="w-full min-h-[44px] px-4 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-primary focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-minbak-caption font-medium text-minbak-black mb-1.5"
              >
                {t("mypage.registeredEmail")}
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="w-full min-h-[44px] px-4 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-gray bg-minbak-bg/50 cursor-not-allowed"
              />
              <p className="mt-1 text-minbak-caption text-minbak-gray">
                {t("profileEdit.emailNote")}
              </p>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-minbak-caption font-medium text-minbak-black mb-1.5"
              >
                {t("mypage.phone")}
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("profileEdit.phonePlaceholder")}
                className="w-full min-h-[44px] px-4 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-minbak-body text-red-600 font-medium">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] px-6 py-2.5 rounded-minbak text-minbak-body font-medium text-white bg-minbak-primary hover:bg-minbak-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t("profileEdit.saving") : t("profileEdit.save")}
        </button>
        <Link
          href="/mypage"
          className="min-h-[44px] px-6 py-2.5 rounded-minbak text-minbak-body font-medium text-minbak-black border border-minbak-light-gray hover:bg-minbak-bg transition-colors inline-flex items-center justify-center"
        >
          {t("profileEdit.cancel")}
        </Link>
      </div>
    </form>
  );
}
