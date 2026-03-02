"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import Link from "next/link";
import DeleteListingButton from "@/components/host/DeleteListingButton";
import AmenitySelector from "@/components/host/AmenitySelector";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { uploadListingImages, getUploadErrorMessage } from "@/lib/useListingImageUpload";
import { uploadVideoClientWithProgress, canUseVideoUpload, LISTING_VIDEO_MAX_BYTES, LISTING_VIDEO_ACCEPT } from "@/lib/cloudinary-client-upload";
import { toast } from "sonner";
import type { Amenity } from "@/types";

type Host = { id: string; email: string; name: string };

type Props = {
  listingId: string;
  amenities: Amenity[];
  isAdmin?: boolean;
  hosts?: Host[];
  currentHostId?: string;
  initial: {
    title: string;
    hostDisplayName?: string | null;
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
    instantBooking: boolean;
    hidden?: boolean;
    cancellationPolicy: string;
    houseRules: string;
    icalImportUrls: string[];
    beds24Enabled?: boolean;
    beds24PropId?: string | null;
    beds24RoomId?: string | null;
    beds24PriceMultiplier?: number | null;
    beds24JanuaryFactor?: number;
    beds24FebruaryFactor?: number;
    beds24MarchFactor?: number;
    beds24AprilFactor?: number;
    beds24MayFactor?: number;
    beds24JuneFactor?: number;
    beds24JulyFactor?: number;
    beds24AugustFactor?: number;
    beds24SeptemberFactor?: number;
    beds24OctoberFactor?: number;
    beds24NovemberFactor?: number;
    beds24DecemberFactor?: number;
    minStayNights?: number | null;
    maxStayNights?: number | null;
    amenityIds: string[];
    mapUrl?: string;
    videoUrl?: string | null;
    propertyType: "apartment" | "detached_house";
  };
};

export default function EditListingForm({
  listingId,
  amenities,
  isAdmin = false,
  hosts = [],
  currentHostId = "",
  initial,
}: Props) {
  const router = useRouter();
  const { t } = useHostTranslations();
  const [loading, setLoading] = useState(false);
  const [icalRefreshLoading, setIcalRefreshLoading] = useState(false);
  const [beds24PriceSyncLoading, setBeds24PriceSyncLoading] = useState(false);
  const [error, setError] = useState("");
  const { formatForHost } = useCurrency();
  const [form, setForm] = useState({
    hostId: currentHostId,
    title: initial.title,
    hostDisplayName: initial.hostDisplayName ?? "",
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
    instantBooking: initial.instantBooking ?? false,
    hidden: initial.hidden ?? false,
    cancellationPolicy: initial.cancellationPolicy ?? "flexible",
    houseRules: initial.houseRules ?? "",
    icalImportUrls: initial.icalImportUrls.join("\n"),
    beds24Enabled: initial.beds24Enabled ?? !!(initial.beds24PropId?.trim() && initial.beds24RoomId?.trim()),
    beds24PropId: initial.beds24PropId ?? "",
    beds24RoomId: initial.beds24RoomId ?? "",
    beds24PriceMultiplier: initial.beds24PriceMultiplier != null ? String(initial.beds24PriceMultiplier) : "1",
    beds24JanuaryFactor: String(initial.beds24JanuaryFactor ?? 1),
    beds24FebruaryFactor: String(initial.beds24FebruaryFactor ?? 1),
    beds24MarchFactor: String(initial.beds24MarchFactor ?? 1),
    beds24AprilFactor: String(initial.beds24AprilFactor ?? 1),
    beds24MayFactor: String(initial.beds24MayFactor ?? 1),
    beds24JuneFactor: String(initial.beds24JuneFactor ?? 1),
    beds24JulyFactor: String(initial.beds24JulyFactor ?? 1),
    beds24AugustFactor: String(initial.beds24AugustFactor ?? 1),
    beds24SeptemberFactor: String(initial.beds24SeptemberFactor ?? 1),
    beds24OctoberFactor: String(initial.beds24OctoberFactor ?? 1),
    beds24NovemberFactor: String(initial.beds24NovemberFactor ?? 1),
    beds24DecemberFactor: String(initial.beds24DecemberFactor ?? 1),
    minStayNights: initial.minStayNights != null ? String(initial.minStayNights) : "",
    maxStayNights: initial.maxStayNights != null ? String(initial.maxStayNights) : "",
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
        hostDisplayName: form.hostDisplayName.trim() || null,
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
        instantBooking: form.instantBooking,
        hidden: form.hidden,
        cancellationPolicy: form.cancellationPolicy,
        houseRules: form.houseRules,
        icalImportUrls: form.icalImportUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean),
        beds24Enabled: form.beds24Enabled,
        beds24PropId: form.beds24PropId?.trim() || null,
        beds24RoomId: form.beds24RoomId?.trim() || null,
        beds24PriceMultiplier: (() => {
          const v = parseFloat(form.beds24PriceMultiplier);
          return !isNaN(v) && v > 0 ? v : null;
        })(),
        beds24JanuaryFactor: parseFloat(form.beds24JanuaryFactor) || 1,
        beds24FebruaryFactor: parseFloat(form.beds24FebruaryFactor) || 1,
        beds24MarchFactor: parseFloat(form.beds24MarchFactor) || 1,
        beds24AprilFactor: parseFloat(form.beds24AprilFactor) || 1,
        beds24MayFactor: parseFloat(form.beds24MayFactor) || 1,
        beds24JuneFactor: parseFloat(form.beds24JuneFactor) || 1,
        beds24JulyFactor: parseFloat(form.beds24JulyFactor) || 1,
        beds24AugustFactor: parseFloat(form.beds24AugustFactor) || 1,
        beds24SeptemberFactor: parseFloat(form.beds24SeptemberFactor) || 1,
        beds24OctoberFactor: parseFloat(form.beds24OctoberFactor) || 1,
        beds24NovemberFactor: parseFloat(form.beds24NovemberFactor) || 1,
        beds24DecemberFactor: parseFloat(form.beds24DecemberFactor) || 1,
        minStayNights: (() => {
          const v = parseInt(form.minStayNights, 10);
          return !isNaN(v) && v >= 1 ? v : null;
        })(),
        maxStayNights: (() => {
          const v = parseInt(form.maxStayNights, 10);
          return !isNaN(v) && v >= 1 ? v : null;
        })(),
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
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.hostDisplayNameLabel")}</span>
              <input
                type="text"
                value={form.hostDisplayName}
                onChange={(e) => setForm((f) => ({ ...f, hostDisplayName: e.target.value }))}
                placeholder={t("newListing.hostDisplayNamePlaceholder")}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
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
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.minStayNights")}</span>
                <input
                  type="number"
                  min={1}
                  value={form.minStayNights}
                  onChange={(e) => setForm((f) => ({ ...f, minStayNights: e.target.value }))}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                  placeholder="1"
                />
                <span className="text-minbak-caption text-minbak-gray block mt-0.5">{t("newListing.minStayNightsHint")}</span>
              </label>
              <label>
                <span className="text-minbak-body font-medium text-minbak-black block mb-1">{t("newListing.maxStayNights")}</span>
                <input
                  type="number"
                  min={1}
                  value={form.maxStayNights}
                  onChange={(e) => setForm((f) => ({ ...f, maxStayNights: e.target.value }))}
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                  placeholder=""
                />
                <span className="text-minbak-caption text-minbak-gray block mt-0.5">{t("newListing.maxStayNightsHint")}</span>
              </label>
            </div>
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
                    ≈ {formatForHost(monthlyPrice(form.januaryFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.februaryFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.marchFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.aprilFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.mayFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.juneFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.julyFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.augustFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.septemberFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.octoberFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.novemberFactor))}{t("edit.perNight")}
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
                    ≈ {formatForHost(monthlyPrice(form.decemberFactor))}{t("edit.perNight")}
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
            {/* 예약 방식 */}
            <div className="border border-minbak-light-gray rounded-minbak p-4 space-y-3 bg-minbak-bg/50">
              <h3 className="text-minbak-body font-medium text-minbak-black">{t("edit.bookingMode")}</h3>
              <p className="text-minbak-caption text-minbak-gray">
                {t("edit.bookingModeHint")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, instantBooking: false }))}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    !form.instantBooking ? "border-[#E31C23] bg-red-50/50" : "border-minbak-light-gray hover:bg-white"
                  }`}
                >
                  <span className="text-minbak-body font-medium text-minbak-black block">
                    {t("edit.bookingModeApproval")}
                  </span>
                  <span className="text-minbak-caption text-minbak-gray mt-0.5 block">
                    {t("edit.bookingModeApprovalDesc")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, instantBooking: true }))}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    form.instantBooking ? "border-[#E31C23] bg-red-50/50" : "border-minbak-light-gray hover:bg-white"
                  }`}
                >
                  <span className="text-minbak-body font-medium text-minbak-black block">
                    {t("edit.bookingModeInstant")}
                  </span>
                  <span className="text-minbak-caption text-minbak-gray mt-0.5 block">
                    {t("edit.bookingModeInstantDesc")}
                  </span>
                </button>
              </div>
            </div>
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
            <div className="border border-minbak-light-gray rounded-minbak p-4 space-y-4 bg-minbak-bg/50">
              <h3 className="text-minbak-body font-medium text-minbak-black">
                {t("edit.calendarSync")}
              </h3>
              {/* 시나리오 선택 */}
              <div>
                <span className="text-minbak-caption font-medium text-minbak-black block mb-2">
                  {t("edit.calendarScenarioLabel")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, beds24Enabled: false }))}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      !form.beds24Enabled ? "border-[#E31C23] bg-red-50/50" : "border-minbak-light-gray hover:bg-white"
                    }`}
                  >
                    <span className="text-minbak-body font-medium text-minbak-black block">
                      {t("edit.calendarScenarioIcal")}
                    </span>
                    <span className="text-minbak-caption text-minbak-gray mt-0.5 block">
                      {t("edit.calendarIcalDesc")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, beds24Enabled: true }))}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      form.beds24Enabled ? "border-[#E31C23] bg-red-50/50" : "border-minbak-light-gray hover:bg-white"
                    }`}
                  >
                    <span className="text-minbak-body font-medium text-minbak-black block">
                      {t("edit.calendarScenarioBeds24")}
                    </span>
                    <span className="text-minbak-caption text-minbak-gray mt-0.5 block">
                      {t("edit.calendarBeds24Desc")}
                    </span>
                  </button>
                </div>
              </div>
              {/* Export — iCal만 선택 시 (Beds24 API 선택 시에는 아래 API 박스 내에 URL만 표시) */}
              {!form.beds24Enabled && (
              <div>
                <span className="text-minbak-caption font-medium text-minbak-black block mb-1">
                  {t("edit.exportTitle")}
                </span>
                <p className="text-minbak-caption text-minbak-gray mb-1">{t("edit.exportHint")}</p>
                <code className="block text-minbak-caption text-minbak-black break-all bg-white border border-minbak-light-gray rounded px-2 py-1.5">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/api/listings/${listingId}/calendar.ics`
                    : `/api/listings/${listingId}/calendar.ics`}
                </code>
              </div>
              )}
              {/* Beds24 API — beds24Enabled 시에만 */}
              {form.beds24Enabled && (
                <div className="p-4 border border-minbak-light-gray rounded-minbak bg-white space-y-3">
                  <h4 className="text-minbak-body font-semibold text-minbak-black">{t("edit.beds24ApiTitle")}</h4>
                  <p className="text-minbak-caption text-minbak-gray">{t("edit.beds24ApiHint")}</p>
                  <label className="block">
                    <span className="text-minbak-caption font-medium text-minbak-black block mb-1">{t("edit.beds24PropId")}</span>
                    <input
                      type="text"
                      value={form.beds24PropId}
                      onChange={(e) => setForm((f) => ({ ...f, beds24PropId: e.target.value }))}
                      placeholder="12345"
                      className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    />
                  </label>
                  <label className="block">
                    <span className="text-minbak-caption font-medium text-minbak-black block mb-1">{t("edit.beds24RoomId")}</span>
                    <input
                      type="text"
                      value={form.beds24RoomId}
                      onChange={(e) => setForm((f) => ({ ...f, beds24RoomId: e.target.value }))}
                      placeholder="1"
                      className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body"
                    />
                  </label>
                  <div>
                    <span className="text-minbak-caption font-medium text-minbak-black block mb-1">{t("edit.beds24PriceMultiplierMonthly")}</span>
                    <p className="text-minbak-caption text-minbak-gray mb-2">{t("edit.beds24PriceMultiplierHint")}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {[
                        { key: "beds24JanuaryFactor" as const, month: 1 },
                        { key: "beds24FebruaryFactor" as const, month: 2 },
                        { key: "beds24MarchFactor" as const, month: 3 },
                        { key: "beds24AprilFactor" as const, month: 4 },
                        { key: "beds24MayFactor" as const, month: 5 },
                        { key: "beds24JuneFactor" as const, month: 6 },
                        { key: "beds24JulyFactor" as const, month: 7 },
                        { key: "beds24AugustFactor" as const, month: 8 },
                        { key: "beds24SeptemberFactor" as const, month: 9 },
                        { key: "beds24OctoberFactor" as const, month: 10 },
                        { key: "beds24NovemberFactor" as const, month: 11 },
                        { key: "beds24DecemberFactor" as const, month: 12 },
                      ].map(({ key, month }) => (
                        <label key={key} className="text-minbak-caption text-minbak-gray">
                          <span className="block mb-0.5">{t("edit.monthFactor", { month })}</span>
                          <input
                            type="number"
                            min={0.01}
                            max={2}
                            step={0.01}
                            value={form[key]}
                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                            placeholder="1"
                            className="w-full px-2 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-minbak-caption text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                    {t("edit.beds24PriceSyncNote")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={beds24PriceSyncLoading}
                      onClick={async () => {
                        setBeds24PriceSyncLoading(true);
                        try {
                          const res = await fetch(`/api/listings/${listingId}/beds24-price-sync`, {
                            method: "POST",
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "동기화 실패");
                          toast.success(t("edit.beds24PriceSyncSuccess", { count: data.updated ?? 0 }));
                          router.refresh();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : t("edit.beds24PriceSyncFailed"));
                        } finally {
                          setBeds24PriceSyncLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 text-minbak-caption font-medium rounded border border-minbak-primary text-minbak-primary hover:bg-minbak-primary/10 disabled:opacity-50"
                    >
                      {beds24PriceSyncLoading ? t("edit.beds24PriceSyncing") : t("edit.beds24PriceSyncNow")}
                    </button>
                    <a href={`/api/listings/${listingId}/beds24-debug`} target="_blank" rel="noopener noreferrer" className="text-minbak-caption text-minbak-primary hover:underline">
                      {t("edit.beds24DebugLink")} →
                    </a>
                  </div>
                </div>
              )}
              {/* Import — iCal만 선택 시에만 (Beds24 API 선택 시에는 불필요) */}
              {!form.beds24Enabled && (
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
                <p className="text-minbak-caption text-minbak-gray mb-2">{t("edit.importSaveNote")}</p>
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
              )}
            </div>
            {error && (
              <p className="text-minbak-body text-minbak-primary" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 flex-wrap">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button type="submit" variant="secondary" disabled={loading || videoUploadStatus === "uploading"}>
                  {loading
                    ? t("edit.saving")
                    : videoUploadStatus === "uploading"
                      ? t("newListing.videoUploadingButton", { percent: videoUploadProgress })
                      : t("edit.save")}
                </Button>
                <DeleteListingButton listingId={listingId} listingTitle={initial.title} />
              </div>
              <label
                className="flex items-center gap-2.5 cursor-pointer select-none p-3 rounded-lg border border-minbak-light-gray bg-white hover:bg-minbak-bg/50 transition-colors sm:min-w-[200px]"
                title={t("edit.hideOnOtaDescription")}
              >
                <input
                  type="checkbox"
                  checked={form.hidden}
                  onChange={(e) => setForm((f) => ({ ...f, hidden: e.target.checked }))}
                  className="w-4 h-4 accent-rose-500 rounded"
                />
                <span className="text-minbak-body font-medium text-minbak-black">
                  {t("edit.hideOnOta")} {form.hidden ? "(ON)" : "(OFF)"}
                </span>
              </label>
            </div>
          </form>
        </div>
        <Footer />
      </main>
    </>
  );
}
