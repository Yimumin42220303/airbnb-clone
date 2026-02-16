"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import Link from "next/link";
import AmenitySelector from "@/components/host/AmenitySelector";
import { uploadListingImages, getUploadErrorMessage } from "@/lib/useListingImageUpload";
import type { Amenity, Category } from "@/types";

type Props = {
  amenities: Amenity[];
  categories: Category[];
};

export default function NewListingForm({ amenities, categories: initialCategories }: Props) {
  const router = useRouter();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = parseInt(form.pricePerNight, 10);
    const baseGuests = parseInt(form.baseGuests, 10) || 2;
    const maxGuests = parseInt(form.maxGuests, 10) || 2;
    if (!form.title.trim() || !form.location.trim() || imageFiles.length === 0 || isNaN(price) || price < 0) {
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
      let imageUrls: string[];
      try {
        imageUrls = await uploadListingImages(imageFiles);
        if (imageUrls.length === 0) {
          setError("이미지 업로드에 실패했습니다.");
          return;
        }
      } catch (uploadErr) {
        setError(`이미지 업로드 실패: ${getUploadErrorMessage(uploadErr)}`);
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
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError(`숙소 등록 서버 오류 (HTTP ${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(data.error || "등록에 실패했습니다.");
        return;
      }
      router.push("/admin/listings");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("숙소 등록 에러:", msg, err);
      setError(`네트워크 오류가 발생했습니다. (${msg})`);
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
          ← 숙소 목록
        </Link>
        <Link
          href="/admin"
          className="text-minbak-body text-minbak-gray hover:text-minbak-black hover:underline"
        >
          관리자 대시보드
        </Link>
      </div>

      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
        숙소 등록
      </h1>
      <p className="text-minbak-body text-minbak-gray mb-8">
        관리자만 등록할 수 있습니다. 아래 섹션을 순서대로 입력해 주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* 섹션 1: 기본 정보 — Framer 등 외부 콘텐츠 반영 시 이 블록을 교체 가능 */}
        <section className="rounded-2xl border border-minbak-light-gray bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-minbak-black mb-4">
            1. 기본 정보
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                숙소명 *
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
                위치 *
              </span>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="예: 신주쿠구, 도쿄 / 다카다노바바역 도보 6분"
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                required
              />
            </label>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                구글 지도 링크 (선택)
              </span>
              <input
                type="text"
                value={form.mapUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mapUrl: e.target.value }))
                }
                placeholder='예: https://www.google.com/maps/embed?... 또는 &lt;iframe ...&gt; 전체'
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak font-mono text-[13px]"
              />
              <p className="text-minbak-caption text-minbak-gray mt-1">
                구글 지도에서 &quot;지도 퍼가기&quot; 코드를 복사해 그대로 붙여넣거나, iframe 코드 안의
                src 주소만 붙여 넣어 주세요.
              </p>
            </label>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                카테고리
              </span>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
              >
                <option value="">선택 안 함</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-minbak-caption text-minbak-gray mt-1">
                없으면 아래에서 새 카테고리를 만들 수 있습니다.
              </p>
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 min-w-[200px]">
                <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                  새 카테고리 만들기
                </span>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="예: 도미토리, 개인실, 아파트"
                  className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak"
                />
              </label>
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || addingCategory}
                className="px-4 py-2 bg-minbak-black text-white rounded-minbak hover:bg-minbak-gray disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingCategory ? "추가 중…" : "추가"}
              </button>
            </div>
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                설명
              </span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak resize-y"
                placeholder="숙소 소개, 교통, 주변 정보 등"
              />
            </label>
          </div>
        </section>

        {/* 섹션 2: 이미지 — 직접 업로드 (첫 장이 대표 이미지) */}
        <section className="rounded-2xl border border-minbak-light-gray bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-minbak-black mb-4">
            2. 이미지
          </h2>
          <p className="text-minbak-caption text-minbak-gray mb-4">
            첫 번째 이미지가 대표 이미지로 사용됩니다. JPEG/PNG/WebP/GIF, 최대 4MB, 최대 100장.
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
                    alt={`미리보기 ${i + 1}`}
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
                      대표
                    </span>
                  )}
                </div>
              ))}
            </div>
            {imageFiles.length < 100 && (
              <label className="block">
                <span className="sr-only">이미지 추가</span>
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
            3. 요금 · 수용 인원
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-minbak-body font-medium text-minbak-black block mb-1">
                1박 요금 (원) *
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
                청소비 (원)
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
                1회 예약당 1회 적용됩니다.
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">
                  기본 숙박 인원 (명)
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
                  이 인원까지는 1박 요금에 포함됩니다.
                </span>
              </label>
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">
                  최대 인원 (명)
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
                  추가 인원 1인당 1박 요금 (원)
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
                  기본 인원 초과 1인당 1박 기준 추가 요금입니다.
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label>
                <span className="text-minbak-caption text-minbak-gray block mb-1">
                  침실
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
                  침대
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
                  욕실
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
            {/* 프로모션대상 토글 (직영숙소) */}
            <div className="border border-minbak-light-gray rounded-minbak p-4 bg-minbak-bg/50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPromoted}
                  onChange={(e) => setForm((f) => ({ ...f, isPromoted: e.target.checked }))}
                  className="w-5 h-5 rounded accent-rose-500"
                />
                <div>
                  <span className="text-minbak-body font-medium text-minbak-black">프로모션대상 (직영숙소)</span>
                  <p className="text-minbak-caption text-minbak-gray">체크하면 숙소 카드에 &apos;프로모션대상&apos; 배지가 표시됩니다.</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* 취소 정책 */}
        <section className="border border-minbak-light-gray rounded-minbak p-5 space-y-3 bg-minbak-bg/50">
          <h3 className="text-minbak-body font-medium text-minbak-black">취소 정책</h3>
          <p className="text-minbak-caption text-minbak-gray">
            게스트의 예약 취소 시 적용할 환불 정책을 선택하세요.
          </p>
          <div className="space-y-2">
            {([
              { value: "flexible", label: "유연", desc: "체크인 1일 전까지 취소 시 100% 환불" },
              { value: "moderate", label: "보통", desc: "체크인 7일 전까지 100% 환불, 1~6일 전 50% 환불" },
              { value: "strict", label: "엄격", desc: "예약 후 48시간 이내(체크인 14일 이상) 100% 환불, 7일 전까지 50% 환불" },
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
                  <span className="font-medium text-minbak-body text-minbak-black">{opt.label}</span>
                  <p className="text-minbak-caption text-minbak-gray mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        <AmenitySelector
          amenities={amenities}
          selectedIds={form.amenityIds}
          onToggle={toggleAmenity}
        />

        {error && (
          <p className="text-minbak-body text-minbak-primary" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "등록 중..." : "숙소 등록하기"}
          </Button>
          <Link href="/admin/listings">
            <Button type="button" variant="secondary">
              취소
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
