"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import Link from "next/link";
import DeleteListingButton from "@/components/host/DeleteListingButton";
import AmenitySelector from "@/components/host/AmenitySelector";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { uploadListingImages, getUploadErrorMessage } from "@/lib/useListingImageUpload";
import { uploadVideoClientWithProgress, canUseVideoUpload, LISTING_VIDEO_MAX_BYTES, LISTING_VIDEO_ACCEPT } from "@/lib/cloudinary-client-upload";
import { toast } from "sonner";
import type { Amenity, Category } from "@/types";

type Host = { id: string; email: string; name: string };

type Props = {
  listingId: string;
  amenities: Amenity[];
  categories: Category[];
  isAdmin?: boolean;
  hosts?: Host[];
  currentHostId?: string;
  initial: {
    title: string;
    location: string;
    description: string;
    pricePerNight: number;
    cleaningFee: number;
    baseGuests: number;
    imageUrls: string[];
    maxGuests: number;
    extraGuestFee: number;
    januaryFactor: number;
    februaryFactor: number;
    marchFactor: number;
    aprilFactor: number;
    mayFactor: number;
    juneFactor: number;
    julyFactor: number;
    augustFactor: number;
    septemberFactor: number;
    octoberFactor: number;
    novemberFactor: number;
    decemberFactor: number;
    bedrooms: number;
    beds: number;
    baths: number;
    isPromoted: boolean;
    cancellationPolicy: string;
    houseRules: string;
    categoryId: string;
    icalImportUrls: string[];
    amenityIds: string[];
    mapUrl?: string;
    videoUrl?: string | null;
    propertyType: "apartment" | "detached_house";
  };
};

export default function EditListingForm({
  listingId,
  amenities,
  categories: initialCategories,
  isAdmin = false,
  hosts = [],
  currentHostId = "",
  initial,
}: Props) {
  const router = useRouter();
  const { t } = useHostTranslations();
  const [loading, setLoading] = useState(false);
  const [icalRefreshLoading, setIcalRefreshLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [form, setForm] = useState({
    hostId: currentHostId,
    title: initial.title,
    location: initial.location,
    description: initial.description,
    pricePerNight: String(initial.pricePerNight),
    cleaningFee: String(initial.cleaningFee),
    baseGuests: String(initial.baseGuests),
    maxGuests: String(initial.maxGuests),
    extraGuestFee: String(initial.extraGuestFee),
    januaryFactor: String(initial.januaryFactor),
    februaryFactor: String(initial.februaryFactor),
    marchFactor: String(initial.marchFactor),
    aprilFactor: String(initial.aprilFactor),
    mayFactor: String(initial.mayFactor),
    juneFactor: String(initial.juneFactor),
    julyFactor: String(initial.julyFactor),
    augustFactor: String(initial.augustFactor),
    septemberFactor: String(initial.septemberFactor),
    octoberFactor: String(initial.octoberFactor),
    novemberFactor: String(initial.novemberFactor),
    decemberFactor: String(initial.decemberFactor),
    bedrooms: String(initial.bedrooms),
    beds: String(initial.beds),
    baths: String(initial.baths),
    isPromoted: initial.isPromoted,
    cancellationPolicy: initial.cancellationPolicy ?? "flexible",
    houseRules: initial.houseRules ?? "",
    categoryId: initial.categoryId,
    icalImportUrls: initial.icalImportUrls.join("\n"),
    amenityIds: initial.amenityIds ?? [],
    mapUrl: initial.mapUrl ?? "",
    videoUrl: initial.videoUrl ?? "",
    propertyType: initial.propertyType ?? "apartment",
  });
  const basePriceNumber =
    parseInt(form.pricePerNight, 10) || initial.pricePerNight;
  const normalizeFactor = (value: string) => {
    const f = parseFloat(value);
    return !isNaN(f) && f > 0 ? f : 1;
  };
  const monthlyPrice = (value: string) =>
    Math.round(basePriceNumber * normalizeFactor(value));
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
    initial.imageUrls.length > 0 ? initial.imageUrls : []
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [videoUploadStatus, setVideoUploadStatus] = useState<"idle" | "uploading" | "done" | "error">(
    initial.videoUrl ? "done" : "idle"
  );
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  function toggleAmenity(id: string) {
    setForm((f) => ({
      ...f,
      amenityIds: f.amenityIds.includes(id)
        ? f.amenityIds.filter((x) => x !== id)
        : [...f.amenityIds, id],
    }));
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setAddingCategory(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("newListing.categoryAddFailed"));
        return;
      }
      const newCat = { id: data.id, name: data.name };
      setCategories((prev) => [...prev, newCat]);
      setForm((f) => ({ ...f, categoryId: data.id }));
      setNewCategoryName("");
    } catch {
      setError(t("newListing.categoryAddNetworkError"));
    } finally {
      setAddingCategory(false);
    }
  }

  function addNewImageFiles(files: FileList | null) {
    if (!files?.length) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const toAdd = Array.from(files).filter((f) => allowed.includes(f.type) && f.size <= 4 * 1024 * 1024);
    const maxToAdd = Math.max(0, 100 - existingImageUrls.length);
    setNewImageFiles((prev) => [...prev, ...toAdd].slice(0, maxToAdd));
  }

  const allThumbnails = [
    ...existingImageUrls.map((url, index) => ({ kind: "existing" as const, url, index })),
    ...newImageFiles.map((file, index) => ({ kind: "new" as const, file, index })),
  ];

  function handleImageDrop(targetGlobalIndex: number) {
    if (dragIndex === null || dragIndex === targetGlobalIndex) return;
    const totalExisting = existingImageUrls.length;

    // 현재 전체 리스트를 하나의 배열로 취급해 순서를 바꾼 뒤,
    // 다시 existing / new 로 나누어 상태에 반영
    const combined: { kind: "existing" | "new"; value: string | File }[] = [
      ...existingImageUrls.map((url) => ({ kind: "existing" as const, value: url })),
      ...newImageFiles.map((file) => ({ kind: "new" as const, value: file })),
    ];

    const next = [...combined];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetGlobalIndex, 0, moved);

    const nextExisting: string[] = [];
    const nextNew: File[] = [];
    for (const item of next) {
      if (item.kind === "existing") nextExisting.push(item.value as string);
      else nextNew.push(item.value as File);
    }

    setExistingImageUrls(nextExisting);
    setNewImageFiles(nextNew);
    setDragIndex(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = parseInt(form.pricePerNight, 10);
    const totalImages = existingImageUrls.length + newImageFiles.length;
    const baseGuests = parseInt(form.baseGuests, 10) || 1;
    const maxGuests = parseInt(form.maxGuests, 10) || 2;
    if (!form.title.trim() || !form.location.trim() || totalImages === 0 || isNaN(price) || price < 0) {
      setError(t("newListing.validationRequired"));
      return;
    }
    if (baseGuests < 1) {
      setError(t("newListing.validationBaseGuests"));
      return;
    }
    if (maxGuests < baseGuests) {
      setError(t("newListing.validationMaxGuests"));
      return;
    }
    setLoading(true);
    try {
      let finalUrls = [...existingImageUrls];
      if (newImageFiles.length > 0) {
        try {
          const newUrls = await uploadListingImages(newImageFiles);
          finalUrls = [...existingImageUrls, ...newUrls];
        } catch (uploadErr) {
          setError(t("newListing.uploadFailedWithMessage", { message: getUploadErrorMessage(uploadErr) }));
          return;
        }
      }
      const rawMap = form.mapUrl.trim();
      const mapUrl =
        rawMap && rawMap.includes("<iframe")
          ? (rawMap.match(/src="([^"]+)"/)?.[1] ?? "")
          : rawMap;
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description.trim() || undefined,
        pricePerNight: price,
        cleaningFee: Math.max(0, parseInt(form.cleaningFee, 10) || 0),
        baseGuests,
        maxGuests,
        extraGuestFee: Math.max(0, parseInt(form.extraGuestFee, 10) || 0),
        januaryFactor: parseFloat(form.januaryFactor) || 1,
        februaryFactor: parseFloat(form.februaryFactor) || 1,
        marchFactor: parseFloat(form.marchFactor) || 1,
        aprilFactor: parseFloat(form.aprilFactor) || 1,
        mayFactor: parseFloat(form.mayFactor) || 1,
        juneFactor: parseFloat(form.juneFactor) || 1,
        julyFactor: parseFloat(form.julyFactor) || 1,
        augustFactor: parseFloat(form.augustFactor) || 1,
        septemberFactor: parseFloat(form.septemberFactor) || 1,
        octoberFactor: parseFloat(form.octoberFactor) || 1,
        novemberFactor: parseFloat(form.novemberFactor) || 1,
        decemberFactor: parseFloat(form.decemberFactor) || 1,
        imageUrls: finalUrls,
        bedrooms: parseInt(form.bedrooms, 10) || 1,
        beds: parseInt(form.beds, 10) || 1,
        baths: parseInt(form.baths, 10) || 1,
        isPromoted: form.isPromoted,
        cancellationPolicy: form.cancellationPolicy,
        houseRules: form.houseRules,
        categoryId: form.categoryId.trim() || undefined,
        icalImportUrls: form.icalImportUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean),
        amenityIds: form.amenityIds,
        mapUrl: mapUrl || undefined,
        videoUrl: form.videoUrl != null && String(form.videoUrl).trim() !== "" ? String(form.videoUrl).trim() : null,
        propertyType: form.propertyType,
      };
      if (isAdmin && form.hostId) {
        payload.userId = form.hostId;
      }
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(res.ok ? t("edit.responseError") : t("edit.updateFailed"));
        return;
      }
      if (!res.ok) {
        setError(data.error || t("edit.updateFailedMessage"));
        return;
      }
      router.push("/host/listings");
      router.refresh();
    } catch (e) {
      setError(t("edit.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
        <div className="max-w-[600px] mx-auto py-8">
          <div className="mb-6">
            <Link
              href="/host/listings"
              className="text-minbak-body text-minbak-gray hover:underline"
            >
              {t("edit.backToListings")}
            </Link>
          </div>
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            {t("edit.title")}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {isAdmin && hosts.length > 0 && (
              <div className="border border-minbak-light-gray rounded-minbak p-4 bg-minbak-bg/50">
                <h2 className="text-minbak-body font-semibold text-minbak-black mb-3">
                  {t("edit.hostChange")}
                </h2>
                <label className="block">
                  <span className="text-minbak-caption text-minbak-gray block mb-1">{t("edit.host")}</span>
                  <select
                    value={form.hostId}
                    onChange={(e) => setForm((f) => ({ ...f, hostId: e.target.value }))}
                    className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                  >
                    {hosts.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name || h.email} ({h.email})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.titleRequired")}</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                required
              />
            </label>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.propertyType")}</span>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="propertyType"
                    checked={form.propertyType === "apartment"}
                    onChange={() => setForm((f) => ({ ...f, propertyType: "apartment" }))}
                    className="w-4 h-4"
                  />
                  <span className="text-minbak-body">{t("newListing.typeApartment")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="propertyType"
                    checked={form.propertyType === "detached_house"}
                    onChange={() => setForm((f) => ({ ...f, propertyType: "detached_house" }))}
                    className="w-4 h-4"
                  />
                  <span className="text-minbak-body">{t("newListing.typeDetachedHouse")}</span>
                </label>
              </div>
            </label>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.locationRequired")}</span>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                required
              />
            </label>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                {t("newListing.mapLinkOptional")}
              </span>
              <input
                type="text"
                value={form.mapUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mapUrl: e.target.value }))
                }
                placeholder={t("newListing.mapPlaceholder")}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak font-mono text-[13px]"
              />
            </label>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.category")}</span>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
              >
                <option value="">{t("newListing.categoryNone")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 min-w-[180px]">
                <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.newCategory")}</span>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t("newListing.newCategoryPlaceholder")}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || addingCategory}
                className="px-4 py-2 bg-minbak-black text-white rounded-minbak hover:bg-minbak-gray disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingCategory ? t("newListing.adding") : t("newListing.add")}
              </button>
            </div>
            <div className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                {t("edit.imagesLabel")}
              </span>
              <p className="text-minbak-caption text-minbak-gray mb-2">{t("edit.imagesHint")}</p>
              <div className="flex flex-wrap gap-3 mb-3">
                {allThumbnails.map((thumb, globalIndex) => {
                  const isExisting = thumb.kind === "existing";
                  const isFirst = globalIndex === 0;
                  const handleRemove = () => {
                    if (isExisting) {
                      setExistingImageUrls((prev) => prev.filter((_, idx) => idx !== thumb.index));
                    } else {
                      setNewImageFiles((prev) => prev.filter((_, idx) => idx !== thumb.index));
                    }
                  };
                  const src = isExisting ? (thumb.url as string) : URL.createObjectURL(thumb.file as File);
                  return (
                    <div
                      key={`${thumb.kind}-${thumb.index}-${globalIndex}`}
                      className="relative group cursor-move"
                      draggable
                      onDragStart={() => setDragIndex(globalIndex)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleImageDrop(globalIndex)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL 미리보기 */}
                      <img
                        src={src}
                        alt={isExisting ? t("edit.existingImageN", { n: thumb.index + 1 }) : t("edit.newImageN", { n: thumb.index + 1 })}
                        className="w-24 h-24 object-cover rounded-minbak border border-minbak-light-gray"
                      />
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-sm leading-none flex items-center justify-center hover:bg-black"
                      >
                        ×
                      </button>
                      {isFirst && allThumbnails.length > 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1 rounded">
                          {t("newListing.coverBadge")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {existingImageUrls.length + newImageFiles.length < 100 && (
                <label className="block">
                  <span className="sr-only">{t("newListing.addImages")}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={(e) => {
                      addNewImageFiles(e.target.files);
                      e.target.value = "";
                    }}
                    className="block w-full text-minbak-caption text-minbak-gray file:mr-3 file:py-2 file:px-3 file:rounded-minbak file:border file:border-minbak-light-gray file:bg-white file:text-minbak-body hover:file:bg-minbak-bg"
                  />
                </label>
              )}
            </div>

            <AmenitySelector
              amenities={amenities}
              selectedIds={form.amenityIds}
              onToggle={toggleAmenity}
              title={t("edit.amenitiesTitle")}
              description={t("edit.amenitiesDescription")}
              variant="compact"
            />
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.description")}</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak resize-y"
              />
            </label>
            {canUseVideoUpload() && (
              <div className="block">
                <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.videoLabel")}</span>
                {videoUploadStatus === "uploading" && (
                  <div className="space-y-2 rounded-minbak border border-minbak-light-gray bg-minbak-bg p-4">
                    <p className="text-minbak-body text-minbak-black font-medium">{t("newListing.videoUploading", { percent: videoUploadProgress })}</p>
                    <div className="h-2 w-full rounded-full bg-minbak-light-gray overflow-hidden">
                      <div
                        className="h-full bg-minbak-primary transition-[width] duration-300"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {form.videoUrl && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <video
                        src={form.videoUrl}
                        controls
                        playsInline
                        className="max-w-[200px] max-h-[360px] rounded-minbak border border-minbak-light-gray object-contain bg-black aspect-[9/16]"
                        preload="metadata"
                      />
                      {videoUploadStatus === "done" && (
                        <span className="absolute top-2 left-2 rounded bg-green-600 text-white text-minbak-caption px-2 py-0.5 font-medium">
                          {t("newListing.videoUploadDone")}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, videoUrl: "" }));
                        setVideoUploadStatus("idle");
                        setVideoUploadProgress(0);
                      }}
                      className="text-minbak-caption text-red-600 hover:underline"
                    >
                      {t("newListing.videoRemove")}
                    </button>
                  </div>
                )}
                {videoUploadStatus === "idle" && !form.videoUrl && (
                  <input
                    type="file"
                    accept={LISTING_VIDEO_ACCEPT}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > LISTING_VIDEO_MAX_BYTES) {
                        setError(t("newListing.videoSizeError"));
                        e.target.value = "";
                        return;
                      }
                      setError("");
                      setVideoUploadStatus("uploading");
                      setVideoUploadProgress(0);
                      try {
                        const url = await uploadVideoClientWithProgress(file, (p) => setVideoUploadProgress(p));
                        setForm((f) => ({ ...f, videoUrl: url }));
                        setVideoUploadStatus("done");
                        toast.success(t("edit.videoUploadSuccess"));
                      } catch (err) {
                        setVideoUploadStatus("error");
                        setError(err instanceof Error ? err.message : t("newListing.videoUploadFailed"));
                        toast.error(t("newListing.videoUploadFailed"));
                      }
                      e.target.value = "";
                    }}
                    className="block w-full text-minbak-caption text-minbak-gray file:mr-3 file:py-2 file:px-3 file:rounded-minbak file:border file:border-minbak-light-gray file:bg-white file:text-minbak-body hover:file:bg-minbak-bg"
                  />
                )}
                {videoUploadStatus === "error" && !form.videoUrl && (
                  <div className="space-y-2">
                    <p className="text-minbak-caption text-red-600">{error}</p>
                    <input
                      type="file"
                      accept={LISTING_VIDEO_ACCEPT}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > LISTING_VIDEO_MAX_BYTES) {
                          setError(t("newListing.videoSizeError"));
                          e.target.value = "";
                          return;
                        }
                        setError("");
                        setVideoUploadStatus("uploading");
                        setVideoUploadProgress(0);
                        try {
                          const url = await uploadVideoClientWithProgress(file, (p) => setVideoUploadProgress(p));
                          setForm((f) => ({ ...f, videoUrl: url }));
                          setVideoUploadStatus("done");
                          toast.success(t("edit.videoUploadSuccess"));
                        } catch (err) {
                          setVideoUploadStatus("error");
                          setError(err instanceof Error ? err.message : t("newListing.videoUploadFailed"));
                          toast.error(t("newListing.videoUploadFailed"));
                        }
                        e.target.value = "";
                      }}
                      className="block w-full text-minbak-caption text-minbak-gray file:mr-3 file:py-2 file:px-3 file:rounded-minbak file:border file:border-minbak-light-gray file:bg-white file:text-minbak-body hover:file:bg-minbak-bg"
                    />
                  </div>
                )}
              </div>
            )}
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.pricePerNight")}</span>
              <input
                type="number"
                min={0}
                value={form.pricePerNight}
                onChange={(e) => setForm((f) => ({ ...f, pricePerNight: e.target.value }))}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                required
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">{t("newListing.baseGuests")}</span>
                <input
                  type="number"
                  min={1}
                  value={form.baseGuests}
                  onChange={(e) => setForm((f) => ({ ...f, baseGuests: e.target.value }))}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
                <span className="text-minbak-caption text-minbak-gray block mt-0.5">{t("newListing.baseGuestsHint")}</span>
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">{t("newListing.maxGuests")}</span>
                <input
                  type="number"
                  min={1}
                  value={form.maxGuests}
                  onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">{t("newListing.extraGuestFee")}</span>
                <input
                  type="number"
                  min={0}
                  value={form.extraGuestFee}
                  onChange={(e) => setForm((f) => ({ ...f, extraGuestFee: e.target.value }))}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                  placeholder="0"
                />
                <span className="text-minbak-caption text-minbak-gray block mt-0.5">{t("newListing.extraGuestFeeHint")}</span>
              </label>
            </div>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.cleaningFee")}</span>
              <input
                type="number"
                min={0}
                value={form.cleaningFee}
                onChange={(e) => setForm((f) => ({ ...f, cleaningFee: e.target.value }))}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                placeholder="0"
              />
              <span className="text-minbak-caption text-minbak-gray block mt-0.5">{t("newListing.cleaningFeeHint")}</span>
            </label>
            <section className="border border-minbak-light-gray rounded-minbak bg-white p-4 space-y-3">
              <h3 className="text-minbak-body font-medium text-minbak-black">
                {t("edit.monthlyFactor")}
              </h3>
              <p className="text-minbak-caption text-minbak-gray">
                {t("edit.monthlyFactorHint")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 1 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.januaryFactor}
                    onChange={(e) => setForm((f) => ({ ...f, januaryFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.januaryFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 2 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.februaryFactor}
                    onChange={(e) => setForm((f) => ({ ...f, februaryFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.februaryFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 3 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.marchFactor}
                    onChange={(e) => setForm((f) => ({ ...f, marchFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.marchFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 4 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.aprilFactor}
                    onChange={(e) => setForm((f) => ({ ...f, aprilFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.aprilFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 5 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.mayFactor}
                    onChange={(e) => setForm((f) => ({ ...f, mayFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.mayFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 6 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.juneFactor}
                    onChange={(e) => setForm((f) => ({ ...f, juneFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.juneFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 7 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.julyFactor}
                    onChange={(e) => setForm((f) => ({ ...f, julyFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.julyFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 8 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.augustFactor}
                    onChange={(e) => setForm((f) => ({ ...f, augustFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.augustFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 9 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.septemberFactor}
                    onChange={(e) => setForm((f) => ({ ...f, septemberFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.septemberFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 10 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.octoberFactor}
                    onChange={(e) => setForm((f) => ({ ...f, octoberFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.octoberFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 11 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.novemberFactor}
                    onChange={(e) => setForm((f) => ({ ...f, novemberFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.novemberFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
                <label className="text-minbak-caption text-minbak-gray">
                  <span className="block mb-1">{t("edit.monthFactor", { month: 12 })}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.decemberFactor}
                    onChange={(e) => setForm((f) => ({ ...f, decemberFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.decemberFactor).toLocaleString()}{t("edit.perNight")}
                  </span>
                </label>
              </div>
            </section>
            <div className="grid grid-cols-3 gap-4">
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">{t("edit.maxGuestsShort")}</span>
                <input
                  type="number"
                  min={1}
                  value={form.maxGuests}
                  onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">{t("newListing.bedrooms")}</span>
                <input
                  type="number"
                  min={0}
                  value={form.bedrooms}
                  onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">{t("newListing.beds")}</span>
                <input
                  type="number"
                  min={0}
                  value={form.beds}
                  onChange={(e) => setForm((f) => ({ ...f, beds: e.target.value }))}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">{t("newListing.baths")}</span>
                <input
                  type="number"
                  min={0}
                  value={form.baths}
                  onChange={(e) => setForm((f) => ({ ...f, baths: e.target.value }))}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
            </div>
            {/* 프로모션대상 토글 (관리자만 표시·변경 가능) */}
            {isAdmin && (
            <div className="border border-minbak-light-gray rounded-minbak p-4 bg-minbak-bg/50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPromoted}
                  onChange={(e) => setForm((f) => ({ ...f, isPromoted: e.target.checked }))}
                  className="w-5 h-5 rounded accent-rose-500"
                />
                <div>
                  <span className="text-minbak-body font-medium text-minbak-black">{t("newListing.promoted")}</span>
                  <p className="text-minbak-caption text-minbak-gray">{t("newListing.promotedHint")}</p>
                </div>
              </label>
            </div>
            )}
            {/* 취소 정책 */}
            <div className="border border-minbak-light-gray rounded-minbak p-4 space-y-3 bg-minbak-bg/50">
              <h3 className="text-minbak-body font-medium text-minbak-black">{t("newListing.cancellationPolicy")}</h3>
              <p className="text-minbak-caption text-minbak-gray">
                {t("newListing.cancellationHint")}
              </p>
              <div className="space-y-2">
                {([
                  { value: "flexible", labelKey: "newListing.policyFlexible", descKey: "newListing.policyFlexibleDesc" },
                  { value: "moderate", labelKey: "newListing.policyModerate", descKey: "newListing.policyModerateDesc" },
                  { value: "strict", labelKey: "newListing.policyStrict", descKey: "newListing.policyStrictDesc" },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      form.cancellationPolicy === opt.value
                        ? "border-[#E31C23] bg-red-50/50"
                        : "border-minbak-light-gray hover:bg-minbak-bg"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancellationPolicy"
                      value={opt.value}
                      checked={form.cancellationPolicy === opt.value}
                      onChange={(e) => setForm((f) => ({ ...f, cancellationPolicy: e.target.value }))}
                      className="mt-0.5 w-4 h-4 accent-rose-500"
                    />
                    <div>
                      <span className="font-medium text-minbak-body text-minbak-black">{t(opt.labelKey)}</span>
                      <p className="text-minbak-caption text-minbak-gray mt-0.5">{t(opt.descKey)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {/* 주의사항 편집 */}
            <div className="border border-minbak-light-gray rounded-minbak p-4 space-y-3 bg-minbak-bg/50">
              <h3 className="text-minbak-body font-medium text-minbak-black">{t("edit.notesSection")}</h3>
              <p className="text-minbak-caption text-minbak-gray">
                {t("edit.notesHint")}
              </p>
              <textarea
                rows={6}
                value={form.houseRules}
                onChange={(e) => setForm((f) => ({ ...f, houseRules: e.target.value }))}
                placeholder={t("edit.notesPlaceholder")}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body resize-y"
              />
            </div>
            <div className="border border-minbak-light-gray rounded-minbak p-4 space-y-3 bg-minbak-bg/50">
              <h3 className="text-minbak-body font-medium text-minbak-black">
                {t("edit.calendarSync")}
              </h3>
              <p className="text-minbak-caption text-minbak-gray">
                {t("edit.calendarSyncHint")}
              </p>
              <div>
                <span className="text-minbak-caption font-medium text-minbak-black block mb-1">
                  {t("edit.exportTitle")}
                </span>
                <p className="text-minbak-caption text-minbak-gray mb-1">
                  {t("edit.exportHint")}
                </p>
                <code className="block text-minbak-caption text-minbak-black break-all bg-white border border-minbak-light-gray rounded px-2 py-1.5">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/api/listings/${listingId}/calendar.ics`
                    : `/api/listings/${listingId}/calendar.ics`}
                </code>
                <div className="mt-3 p-3 border border-minbak-primary/30 bg-minbak-primary/5 rounded-minbak">
                  <p className="text-minbak-caption font-medium text-minbak-black mb-1">{t("edit.calendarSyncBeds24Title")}</p>
                  <p className="text-minbak-caption text-minbak-gray mb-2">{t("edit.calendarSyncBeds24Note")}</p>
                  <Link href="/help/beds24-calendar" target="_blank" rel="noopener noreferrer" className="text-minbak-caption font-medium text-minbak-primary hover:underline">
                    {t("edit.calendarSyncBeds24Link")} →
                  </Link>
                </div>
              </div>
              <label className="block">
                <span className="text-minbak-caption font-medium text-minbak-black block mb-1">
                  {t("edit.importTitle")}
                </span>
                <p className="text-minbak-caption text-minbak-gray mb-1">
                  {t("edit.importHint")}
                </p>
                <p className="text-minbak-caption text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-2">
                  {t("edit.importImportant")}
                </p>
                <p className="text-minbak-caption text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mb-2">
                  {t("edit.importSaveNote")}
                </p>
                <textarea
                  value={form.icalImportUrls}
                  onChange={(e) => setForm((f) => ({ ...f, icalImportUrls: e.target.value }))}
                  placeholder={t("edit.importPlaceholder")}
                  rows={3}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak resize-y font-mono text-minbak-caption"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={icalRefreshLoading || !form.icalImportUrls.trim()}
                    onClick={async () => {
                      setIcalRefreshLoading(true);
                      try {
                        const urls = form.icalImportUrls
                          .split("\n")
                          .map((u) => u.trim())
                          .filter(Boolean);
                        // 1. iCal URLを先に保存（「更新」だけで保存されるように）
                        const saveRes = await fetch(`/api/listings/${listingId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ icalImportUrls: urls }),
                        });
                        if (!saveRes.ok) {
                          const err = await saveRes.json().catch(() => ({}));
                          throw new Error(err.error || t("edit.refreshFailed"));
                        }
                        // 2. キャッシュ無効化
                        const res = await fetch(`/api/listings/${listingId}/ical/refresh`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ urls: urls.length > 0 ? urls : undefined }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || t("edit.refreshFailed"));
                        toast.success(t("edit.refreshSuccess"));
                        router.refresh();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : t("edit.refreshFailed"));
                      } finally {
                        setIcalRefreshLoading(false);
                      }
                    }}
                    className="min-h-[44px] flex items-center px-4 py-2 rounded-minbak border border-minbak-light-gray text-minbak-body font-medium text-minbak-black hover:bg-minbak-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {icalRefreshLoading ? t("edit.refreshing") : t("edit.saveAndRefresh")}
                  </button>
                  <span className="text-minbak-caption text-minbak-gray">
                    {t("edit.refreshButtonHint")}
                  </span>
                </div>
              </label>
            </div>
            {error && (
              <p className="text-minbak-body text-minbak-primary" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
            <Button type="submit" variant="secondary" disabled={loading || videoUploadStatus === "uploading"}>
              {loading
                ? t("edit.saving")
                : videoUploadStatus === "uploading"
                  ? t("newListing.videoUploadingButton", { percent: videoUploadProgress })
                  : t("edit.save")}
            </Button>
              <DeleteListingButton listingId={listingId} listingTitle={initial.title} />
            </div>
          </form>
        </div>
        <Footer />
      </main>
    </>
  );
}
