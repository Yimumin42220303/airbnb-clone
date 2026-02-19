"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import Link from "next/link";
import AmenitySelector from "@/components/host/AmenitySelector";
import { uploadListingImages, getUploadErrorMessage } from "@/lib/useListingImageUpload";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { Amenity, Category } from "@/types";

type Props = {
  amenities: Amenity[];
  categories: Category[];
};

export default function NewListingForm({ amenities, categories: initialCategories }: Props) {
  const router = useRouter();
  const { t } = useHostTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    description: "",
    pricePerNight: "",
    cleaningFee: "0",
    baseGuests: "2",
    maxGuests: "2",
    extraGuestFee: "0",
    bedrooms: "1",
    beds: "1",
    baths: "1",
    categoryId: "" as string,
    mapUrl: "",
    amenityIds: [] as string[],
    isPromoted: false,
    cancellationPolicy: "flexible",
    propertyType: "apartment" as "apartment" | "detached_house",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = parseInt(form.pricePerNight, 10);
    const baseGuests = parseInt(form.baseGuests, 10) || 2;
    const maxGuests = parseInt(form.maxGuests, 10) || 2;
    if (!form.title.trim() || !form.location.trim() || imageFiles.length === 0 || isNaN(price) || price < 0) {
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
      let imageUrls: string[];
      try {
        imageUrls = await uploadListingImages(imageFiles);
        if (imageUrls.length === 0) {
          setError(t("newListing.uploadFailed"));
          return;
        }
      } catch (uploadErr) {
        setError(t("newListing.uploadFailedWithMessage", { message: getUploadErrorMessage(uploadErr) }));
        return;
      }
      const rawMap = form.mapUrl.trim();
      const mapUrl =
        rawMap && rawMap.includes("<iframe")
          ? (rawMap.match(/src="([^"]+)"/)?.[1] ?? "")
          : rawMap;
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          location: form.location.trim(),
          description: form.description.trim() || undefined,
          mapUrl: mapUrl || undefined,
          pricePerNight: price,
          cleaningFee: Math.max(0, parseInt(form.cleaningFee, 10) || 0),
          imageUrls,
          baseGuests,
          maxGuests,
          extraGuestFee: Math.max(0, parseInt(form.extraGuestFee, 10) || 0),
          bedrooms: parseInt(form.bedrooms, 10) || 1,
          beds: parseInt(form.beds, 10) || 1,
          baths: parseInt(form.baths, 10) || 1,
          categoryId: form.categoryId.trim() || undefined,
          amenityIds: form.amenityIds.length > 0 ? form.amenityIds : undefined,
          isPromoted: form.isPromoted,
          cancellationPolicy: form.cancellationPolicy,
          propertyType: form.propertyType,
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError(t("newListing.serverError", { status: String(res.status) }));
        return;
      }
      if (!res.ok) {
        setError(data.error || t("newListing.submitFailed"));
        return;
      }
      router.push("/admin/listings");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("숙소 등록 에러:", msg, err);
      setError(t("newListing.networkError", { message: msg }));
    } finally {
      setLoading(false);
    }
  }

  function addImageFiles(files: FileList | null) {
    if (!files?.length) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const toAdd = Array.from(files).filter((f) => allowed.includes(f.type) && f.size <= 4 * 1024 * 1024);
    setImageFiles((prev) => {
      const next = [...prev, ...toAdd].slice(0, 100);
      return next;
    });
  }

  function handleImageDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setImageFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  }

  function removeImageFile(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="max-w-[720px] mx-auto py-8">
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <Link
          href="/admin/listings"
          className="text-minbak-body text-minbak-gray hover:text-minbak-black hover:underline"
        >
          {t("newListing.backToListings")}
        </Link>
        <Link
          href="/admin"
          className="text-minbak-body text-minbak-gray hover:text-minbak-black hover:underline"
        >
          {t("newListing.adminDashboard")}
        </Link>
      </div>

      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
        {t("listings.addListing")}
      </h1>
      <p className="text-minbak-body text-minbak-gray mb-3">
        {t("newListing.adminOnlyHint")}
      </p>
      <div className="mb-8 rounded-minbak border border-minbak-primary/30 bg-minbak-primary/5 px-4 py-3 text-minbak-body text-minbak-black">
        <p className="font-medium">{t("newListing.approvalNotice")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* 섹션 1: 기본 정보 — Framer 등 외부 콘텐츠 반영 시 이 블록을 교체 가능 */}
        <section className="rounded-2xl border border-minbak-light-gray bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-minbak-black mb-4">
            {t("newListing.sectionBasic")}
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                {t("newListing.titleRequired")}
              </span>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                required
              />
            </label>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                {t("newListing.propertyType")}
              </span>
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
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                {t("newListing.locationRequired")}
              </span>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder={t("newListing.locationPlaceholder")}
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
              <p className="text-minbak-caption text-minbak-gray mt-1">
                {t("newListing.mapHint")}
              </p>
            </label>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                {t("newListing.category")}
              </span>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
              >
                <option value="">{t("newListing.categoryNone")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-minbak-caption text-minbak-gray mt-1">
                {t("newListing.categoryHint")}
              </p>
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 min-w-[200px]">
                <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                  {t("newListing.newCategory")}
                </span>
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
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                {t("newListing.description")}
              </span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak resize-y"
                placeholder={t("newListing.descriptionPlaceholder")}
              />
            </label>
          </div>
        </section>

        {/* 섹션 2: 이미지 — 직접 업로드 (첫 장이 대표 이미지) */}
        <section className="rounded-2xl border border-minbak-light-gray bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-minbak-black mb-4">
            {t("newListing.sectionImages")}
          </h2>
          <p className="text-minbak-caption text-minbak-gray mb-4">
            {t("newListing.imagesHint")}
          </p>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {imageFiles.map((file, i) => (
                <div
                  key={i}
                  className="relative group cursor-move"
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleImageDrop(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob URL 미리보기 */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={t("newListing.previewN", { n: String(i + 1) })}
                    className="w-24 h-24 object-cover rounded-minbak border border-minbak-light-gray"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageFile(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-sm leading-none flex items-center justify-center hover:bg-black"
                  >
                    ×
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1 rounded">
                      {t("newListing.coverBadge")}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {imageFiles.length < 100 && (
              <label className="block">
                <span className="sr-only">{t("newListing.addImages")}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(e) => {
                    addImageFiles(e.target.files);
                    e.target.value = "";
                  }}
                  className="block w-full text-minbak-caption text-minbak-gray file:mr-3 file:py-2 file:px-3 file:rounded-minbak file:border file:border-minbak-light-gray file:bg-white file:text-minbak-body hover:file:bg-minbak-bg"
                />
              </label>
            )}
          </div>
        </section>

        {/* 섹션 3: 요금 · 수용 인원 */}
        <section className="rounded-2xl border border-minbak-light-gray bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-minbak-black mb-4">
            {t("newListing.sectionPricing")}
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                {t("newListing.pricePerNight")}
              </span>
              <input
                type="number"
                min={0}
                value={form.pricePerNight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricePerNight: e.target.value }))
                }
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                required
              />
            </label>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                {t("newListing.cleaningFee")}
              </span>
              <input
                type="number"
                min={0}
                value={form.cleaningFee}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cleaningFee: e.target.value }))
                }
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                placeholder="0"
              />
              <span className="text-minbak-caption text-minbak-gray block mt-0.5">
                {t("newListing.cleaningFeeHint")}
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">
                  {t("newListing.baseGuests")}
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.baseGuests}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, baseGuests: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
                <span className="text-minbak-caption text-minbak-gray block mt-0.5">
                  {t("newListing.baseGuestsHint")}
                </span>
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">
                  {t("newListing.maxGuests")}
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.maxGuests}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxGuests: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">
                  {t("newListing.extraGuestFee")}
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.extraGuestFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, extraGuestFee: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                  placeholder="0"
                />
                <span className="text-minbak-caption text-minbak-gray block mt-0.5">
                  {t("newListing.extraGuestFeeHint")}
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">
                  {t("newListing.bedrooms")}
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.bedrooms}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bedrooms: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">
                  {t("newListing.beds")}
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.beds}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, beds: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">
                  {t("newListing.baths")}
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.baths}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, baths: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
            </div>
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
          </div>
        </section>

        {/* 취소 정책 */}
        <section className="border border-minbak-light-gray rounded-minbak p-5 space-y-3 bg-minbak-bg/50">
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
        </section>

        <AmenitySelector
          amenities={amenities}
          selectedIds={form.amenityIds}
          onToggle={toggleAmenity}
          title={t("newListing.amenitiesSection")}
          description={t("newListing.amenitiesHint")}
        />

        {error && (
          <p className="text-minbak-body text-minbak-primary" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t("newListing.submitting") : t("newListing.submitButton")}
          </Button>
          <Link href="/admin/listings">
            <Button type="button" variant="secondary">
              {t("actions.cancel")}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
