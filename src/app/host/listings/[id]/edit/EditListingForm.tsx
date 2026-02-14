"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import Link from "next/link";
import DeleteListingButton from "@/components/host/DeleteListingButton";
import AmenitySelector from "@/components/host/AmenitySelector";
import { uploadListingImages, getUploadErrorMessage } from "@/lib/useListingImageUpload";
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
    houseRules: string;
    categoryId: string;
    icalImportUrls: string[];
    amenityIds: string[];
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
    houseRules: initial.houseRules ?? "",
    categoryId: initial.categoryId,
    icalImportUrls: initial.icalImportUrls.join("\n"),
    amenityIds: initial.amenityIds ?? [],
    mapUrl: initial.mapUrl ?? "",
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
        setError(data.error || "카테고리 추가에 실패했습니다.");
        return;
      }
      const newCat = { id: data.id, name: data.name };
      setCategories((prev) => [...prev, newCat]);
      setForm((f) => ({ ...f, categoryId: data.id }));
      setNewCategoryName("");
    } catch {
      setError("네트워크 오류로 카테고리를 추가하지 못했습니다.");
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
      setError("숙소명, 위치, 이미지 1장 이상, 1박 요금을 입력해 주세요.");
      return;
    }
    if (baseGuests < 1) {
      setError("기본 숙박 인원은 1명 이상이어야 합니다.");
      return;
    }
    if (maxGuests < baseGuests) {
      setError("최대 인원은 기본 숙박 인원보다 크거나 같아야 합니다.");
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
          setError(`이미지 업로드 실패: ${getUploadErrorMessage(uploadErr)}`);
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
        houseRules: form.houseRules,
        categoryId: form.categoryId.trim() || undefined,
        icalImportUrls: form.icalImportUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean),
        amenityIds: form.amenityIds,
        mapUrl: mapUrl || undefined,
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
        setError(res.ok ? "응답을 처리하지 못했습니다." : "수정에 실패했습니다. 서버 오류일 수 있습니다.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "수정에 실패했습니다.");
        return;
      }
      router.push("/host/listings");
      router.refresh();
    } catch (e) {
      setError("네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해 주세요.");
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
              className="text-airbnb-body text-airbnb-gray hover:underline"
            >
              ← 내 숙소로
            </Link>
          </div>
          <h1 className="text-airbnb-h2 font-semibold text-airbnb-black mb-6">
            숙소 수정
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {isAdmin && hosts.length > 0 && (
              <div className="border border-airbnb-light-gray rounded-airbnb p-4 bg-airbnb-bg/50">
                <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-3">
                  호스트 변경 (관리자 전용)
                </h2>
                <label className="block">
                  <span className="text-airbnb-caption text-airbnb-gray block mb-1">호스트</span>
                  <select
                    value={form.hostId}
                    onChange={(e) => setForm((f) => ({ ...f, hostId: e.target.value }))}
                    className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
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
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">숙소명 *</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                required
              />
            </label>
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">위치 *</span>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                required
              />
            </label>
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">
                구글 지도 링크 (선택)
              </span>
              <input
                type="text"
                value={form.mapUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mapUrl: e.target.value }))
                }
                placeholder='예: https://www.google.com/maps/embed?... 또는 &lt;iframe ...&gt; 전체'
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb font-mono text-[13px]"
              />
            </label>
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">카테고리</span>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
              >
                <option value="">선택 안 함</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 min-w-[180px]">
                <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">새 카테고리 만들기</span>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="예: 도미토리, 개인실"
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || addingCategory}
                className="px-4 py-2 bg-airbnb-black text-white rounded-airbnb hover:bg-airbnb-gray disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingCategory ? "추가 중…" : "추가"}
              </button>
            </div>
            <div className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">
                이미지 * (첫 장이 대표, 최대 100장)
              </span>
              <p className="text-airbnb-caption text-airbnb-gray mb-2">기존 이미지를 유지하거나 새로 업로드할 수 있습니다. JPEG/PNG/WebP/GIF, 최대 4MB.</p>
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
                      <img
                        src={src}
                        alt={isExisting ? `기존 ${thumb.index + 1}` : `새로 추가 ${thumb.index + 1}`}
                        className="w-24 h-24 object-cover rounded-airbnb border border-airbnb-light-gray"
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
                          대표
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {existingImageUrls.length + newImageFiles.length < 100 && (
                <label className="block">
                  <span className="sr-only">이미지 추가</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={(e) => {
                      addNewImageFiles(e.target.files);
                      e.target.value = "";
                    }}
                    className="block w-full text-airbnb-caption text-airbnb-gray file:mr-3 file:py-2 file:px-3 file:rounded-airbnb file:border file:border-airbnb-light-gray file:bg-white file:text-airbnb-body hover:file:bg-airbnb-bg"
                  />
                </label>
              )}
            </div>

            <AmenitySelector
              amenities={amenities}
              selectedIds={form.amenityIds}
              onToggle={toggleAmenity}
              title="부가시설 및 서비스"
              description="게스트가 숙소에서 사용할 수 있는 편의시설을 선택해 주세요."
              variant="compact"
            />
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">설명</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb resize-y"
              />
            </label>
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">1박 요금 (원) *</span>
              <input
                type="number"
                min={0}
                value={form.pricePerNight}
                onChange={(e) => setForm((f) => ({ ...f, pricePerNight: e.target.value }))}
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                required
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">기본 숙박 인원 (명)</span>
                <input
                  type="number"
                  min={1}
                  value={form.baseGuests}
                  onChange={(e) => setForm((f) => ({ ...f, baseGuests: e.target.value }))}
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
                <span className="text-airbnb-caption text-airbnb-gray block mt-0.5">이 인원까지는 1박 요금에 포함됩니다.</span>
              </label>
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">최대 인원 (명)</span>
                <input
                  type="number"
                  min={1}
                  value={form.maxGuests}
                  onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">추가 인원 1인당 1박 요금 (원)</span>
                <input
                  type="number"
                  min={0}
                  value={form.extraGuestFee}
                  onChange={(e) => setForm((f) => ({ ...f, extraGuestFee: e.target.value }))}
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                  placeholder="0"
                />
                <span className="text-airbnb-caption text-airbnb-gray block mt-0.5">기본 인원 초과 1인당 1박 기준 추가 요금입니다.</span>
              </label>
            </div>
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">청소비 (원)</span>
              <input
                type="number"
                min={0}
                value={form.cleaningFee}
                onChange={(e) => setForm((f) => ({ ...f, cleaningFee: e.target.value }))}
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                placeholder="0"
              />
              <span className="text-airbnb-caption text-airbnb-gray block mt-0.5">1회 예약당 1회 적용됩니다.</span>
            </label>
            <section className="border border-airbnb-light-gray rounded-airbnb bg-white p-4 space-y-3">
              <h3 className="text-airbnb-body font-medium text-airbnb-black">
                월별 요금 배수
              </h3>
              <p className="text-airbnb-caption text-airbnb-gray">
                기본 1박 요금에 월별 배수를 곱해 적용합니다. 예: 1월=1.1 → 1월은 기본 요금의 110%가 됩니다.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">1월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.januaryFactor}
                    onChange={(e) => setForm((f) => ({ ...f, januaryFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.januaryFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">2월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.februaryFactor}
                    onChange={(e) => setForm((f) => ({ ...f, februaryFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.februaryFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">3월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.marchFactor}
                    onChange={(e) => setForm((f) => ({ ...f, marchFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.marchFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">4월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.aprilFactor}
                    onChange={(e) => setForm((f) => ({ ...f, aprilFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.aprilFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">5월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.mayFactor}
                    onChange={(e) => setForm((f) => ({ ...f, mayFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.mayFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">6월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.juneFactor}
                    onChange={(e) => setForm((f) => ({ ...f, juneFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.juneFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">7월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.julyFactor}
                    onChange={(e) => setForm((f) => ({ ...f, julyFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.julyFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">8월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.augustFactor}
                    onChange={(e) => setForm((f) => ({ ...f, augustFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.augustFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">9월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.septemberFactor}
                    onChange={(e) => setForm((f) => ({ ...f, septemberFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.septemberFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">10월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.octoberFactor}
                    onChange={(e) => setForm((f) => ({ ...f, octoberFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.octoberFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">11월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.novemberFactor}
                    onChange={(e) => setForm((f) => ({ ...f, novemberFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.novemberFactor).toLocaleString()}/박
                  </span>
                </label>
                <label className="text-airbnb-caption text-airbnb-gray">
                  <span className="block mb-1">12월 배수</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.decemberFactor}
                    onChange={(e) => setForm((f) => ({ ...f, decemberFactor: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    placeholder="1.0"
                  />
                  <span className="block mt-0.5">
                    ≈ ₩{monthlyPrice(form.decemberFactor).toLocaleString()}/박
                  </span>
                </label>
              </div>
            </section>
            <div className="grid grid-cols-3 gap-4">
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">최대 인원</span>
                <input
                  type="number"
                  min={1}
                  value={form.maxGuests}
                  onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">침실</span>
                <input
                  type="number"
                  min={0}
                  value={form.bedrooms}
                  onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">침대</span>
                <input
                  type="number"
                  min={0}
                  value={form.beds}
                  onChange={(e) => setForm((f) => ({ ...f, beds: e.target.value }))}
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">욕실</span>
                <input
                  type="number"
                  min={0}
                  value={form.baths}
                  onChange={(e) => setForm((f) => ({ ...f, baths: e.target.value }))}
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
            </div>
            {/* 프로모션대상 토글 (관리자용) */}
            <div className="border border-airbnb-light-gray rounded-airbnb p-4 bg-airbnb-bg/50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPromoted}
                  onChange={(e) => setForm((f) => ({ ...f, isPromoted: e.target.checked }))}
                  className="w-5 h-5 rounded accent-rose-500"
                />
                <div>
                  <span className="text-airbnb-body font-medium text-airbnb-black">프로모션대상 (직영숙소)</span>
                  <p className="text-airbnb-caption text-airbnb-gray">체크하면 숙소 카드에 &apos;프로모션대상&apos; 배지가 표시됩니다.</p>
                </div>
              </label>
            </div>
            {/* 주의사항 편집 */}
            <div className="border border-airbnb-light-gray rounded-airbnb p-4 space-y-3 bg-airbnb-bg/50">
              <h3 className="text-airbnb-body font-medium text-airbnb-black">주의사항</h3>
              <p className="text-airbnb-caption text-airbnb-gray">
                숙소 상세 페이지에 표시되는 주의사항입니다. 한 줄에 하나씩 입력하세요.
              </p>
              <textarea
                rows={6}
                value={form.houseRules}
                onChange={(e) => setForm((f) => ({ ...f, houseRules: e.target.value }))}
                placeholder={"엘리베이터가 없는 건물인 경우 짐 이동에 유의해 주세요.\n실내에서는 금연입니다.\n밤 10시 이후에는 소음을 줄여 주세요."}
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body resize-y"
              />
            </div>
            <div className="border border-airbnb-light-gray rounded-airbnb p-4 space-y-3 bg-airbnb-bg/50">
              <h3 className="text-airbnb-body font-medium text-airbnb-black">
                캘린더 연동 (중복 예약 방지)
              </h3>
              <p className="text-airbnb-caption text-airbnb-gray">
                에어비앤비·Beds24 등 다른 채널과 같은 숙소를 올렸을 때, 양쪽 예약이 겹치지 않도록 합니다. (임시: iCal/ICS. 추후 Beds24 API 연동 예정)
              </p>
              <div>
                <span className="text-airbnb-caption font-medium text-airbnb-black block mb-1">
                  우리 예약 내보내기 (Export)
                </span>
                <p className="text-airbnb-caption text-airbnb-gray mb-1">
                  아래 URL을 Airbnb·Beds24·구글캘린더의 &quot;캘린더 가져오기&quot;에 등록하면, 우리 사이트에서 잡은 예약이 해당 채널에서 막힙니다.
                </p>
                <code className="block text-airbnb-caption text-airbnb-black break-all bg-white border border-airbnb-light-gray rounded px-2 py-1.5">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/api/listings/${listingId}/calendar.ics`
                    : `/api/listings/${listingId}/calendar.ics`}
                </code>
              </div>
              <label className="block">
                <span className="text-airbnb-caption font-medium text-airbnb-black block mb-1">
                  외부 캘린더 가져오기 (Import) — 한 줄에 URL 하나
                </span>
                <p className="text-airbnb-caption text-airbnb-gray mb-1">
                  각 채널에서 발급한 &quot;캘린더 내보내기&quot; URL을 넣으면, 그 채널에 예약된 날은 우리 사이트에서 선택할 수 없습니다.
                </p>
                <p className="text-airbnb-caption text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-2">
                  <strong>중요:</strong> Airbnb iCal URL은 Airbnb 예약만 포함합니다. Booking.com 등 외부 예약이 Airbnb에 연동되어 있어도, 우리 사이트에 반영하려면 <strong>Booking.com iCal URL을 별도로 추가</strong>하세요.
                </p>
                <p className="text-airbnb-caption text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mb-2">
                  <strong>연동 안 될 때:</strong> URL 입력 후 반드시 <strong>&quot;저장&quot; 버튼</strong>을 눌러야 합니다. 저장 후 숙소 페이지에서 날짜 선택 시 예약된 날이 회색으로 표시됩니다.
                </p>
                <textarea
                  value={form.icalImportUrls}
                  onChange={(e) => setForm((f) => ({ ...f, icalImportUrls: e.target.value }))}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  rows={3}
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb resize-y font-mono text-airbnb-caption"
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
                        const res = await fetch(`/api/listings/${listingId}/ical/refresh`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ urls: urls.length > 0 ? urls : undefined }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "새로고침 실패");
                        alert(data.message || "캘린더를 새로고침했습니다.");
                        router.refresh();
                      } catch (e) {
                        alert(e instanceof Error ? e.message : "새로고침에 실패했습니다.");
                      } finally {
                        setIcalRefreshLoading(false);
                      }
                    }}
                    className="min-h-[44px] flex items-center px-4 py-2 rounded-airbnb border border-airbnb-light-gray text-airbnb-body font-medium text-airbnb-black hover:bg-airbnb-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {icalRefreshLoading ? "새로고침 중..." : "새로고침"}
                  </button>
                  <span className="text-airbnb-caption text-airbnb-gray">
                    입력된 URL의 최신 캘린더를 즉시 반영합니다.
                  </span>
                </div>
              </label>
            </div>
            {error && (
              <p className="text-airbnb-body text-airbnb-red" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
            <Button type="submit" variant="secondary" disabled={loading}>
              {loading ? "저장 중..." : "저장"}
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
