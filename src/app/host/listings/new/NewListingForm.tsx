"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import Link from "next/link";

type Amenity = { id: string; name: string };
type Category = { id: string; name: string };

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
      // 서버 경유 업로드 (파일명을 서버에서 생성하여 blob 충돌 방지)
      let imageUrls: string[];
      try {
        const formData = new FormData();
        imageFiles.forEach((f) => formData.append("files", f));
        const uploadRes = await fetch("/api/upload/listing", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error || "이미지 업로드에 실패했습니다.");
          return;
        }
        imageUrls = uploadData.urls ?? [];
        if (imageUrls.length === 0) {
          setError("이미지 업로드에 실패했습니다.");
          return;
        }
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
        setError(`이미지 업로드 실패: ${msg}`);
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
    const toAdd = Array.from(files).filter((f) => allowed.includes(f.type) && f.size <= 5 * 1024 * 1024);
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
          className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black hover:underline"
        >
          ← 숙소 목록
        </Link>
        <Link
          href="/admin"
          className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black hover:underline"
        >
          관리자 대시보드
        </Link>
      </div>

      <h1 className="text-airbnb-h2 font-semibold text-airbnb-black mb-2">
        숙소 등록
      </h1>
      <p className="text-airbnb-body text-airbnb-gray mb-8">
        관리자만 등록할 수 있습니다. 아래 섹션을 순서대로 입력해 주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* 섹션 1: 기본 정보 — Framer 등 외부 콘텐츠 반영 시 이 블록을 교체 가능 */}
        <section className="rounded-2xl border border-airbnb-light-gray bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-airbnb-black mb-4">
            1. 기본 정보
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">
                숙소명 *
              </span>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                required
              />
            </label>
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">
                위치 *
              </span>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="예: 신주쿠구, 도쿄 / 다카다노바바역 도보 6분"
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
              <p className="text-airbnb-caption text-airbnb-gray mt-1">
                구글 지도에서 &quot;지도 퍼가기&quot; 코드를 복사해 그대로 붙여넣거나, iframe 코드 안의
                src 주소만 붙여 넣어 주세요.
              </p>
            </label>
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">
                카테고리
              </span>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
              >
                <option value="">선택 안 함</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-airbnb-caption text-airbnb-gray mt-1">
                없으면 아래에서 새 카테고리를 만들 수 있습니다.
              </p>
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 min-w-[200px]">
                <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">
                  새 카테고리 만들기
                </span>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="예: 도미토리, 개인실, 아파트"
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
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">
                설명
              </span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb resize-y"
                placeholder="숙소 소개, 교통, 주변 정보 등"
              />
            </label>
          </div>
        </section>

        {/* 섹션 2: 이미지 — 직접 업로드 (첫 장이 대표 이미지) */}
        <section className="rounded-2xl border border-airbnb-light-gray bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-airbnb-black mb-4">
            2. 이미지
          </h2>
          <p className="text-airbnb-caption text-airbnb-gray mb-4">
            첫 번째 이미지가 대표 이미지로 사용됩니다. JPEG/PNG/WebP/GIF, 최대 5MB, 최대 100장.
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
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`미리보기 ${i + 1}`}
                    className="w-24 h-24 object-cover rounded-airbnb border border-airbnb-light-gray"
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
                  className="block w-full text-airbnb-caption text-airbnb-gray file:mr-3 file:py-2 file:px-3 file:rounded-airbnb file:border file:border-airbnb-light-gray file:bg-white file:text-airbnb-body hover:file:bg-airbnb-bg"
                />
              </label>
            )}
          </div>
        </section>

        {/* 섹션 3: 요금 · 수용 인원 */}
        <section className="rounded-2xl border border-airbnb-light-gray bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-airbnb-black mb-4">
            3. 요금 · 수용 인원
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">
                1박 요금 (원) *
              </span>
              <input
                type="number"
                min={0}
                value={form.pricePerNight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricePerNight: e.target.value }))
                }
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                required
              />
            </label>
            <label className="block">
              <span className="text-airbnb-body font-medium text-airbnb-black block mb-1">
                청소비 (원)
              </span>
              <input
                type="number"
                min={0}
                value={form.cleaningFee}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cleaningFee: e.target.value }))
                }
                className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                placeholder="0"
              />
              <span className="text-airbnb-caption text-airbnb-gray block mt-0.5">
                1회 예약당 1회 적용됩니다.
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">
                  기본 숙박 인원 (명)
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.baseGuests}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, baseGuests: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
                <span className="text-airbnb-caption text-airbnb-gray block mt-0.5">
                  이 인원까지는 1박 요금에 포함됩니다.
                </span>
              </label>
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">
                  최대 인원 (명)
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.maxGuests}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxGuests: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">
                  추가 인원 1인당 1박 요금 (원)
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.extraGuestFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, extraGuestFee: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                  placeholder="0"
                />
                <span className="text-airbnb-caption text-airbnb-gray block mt-0.5">
                  기본 인원 초과 1인당 1박 기준 추가 요금입니다.
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">
                  침실
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.bedrooms}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bedrooms: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">
                  침대
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.beds}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, beds: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
              <label>
                <span className="text-airbnb-caption text-airbnb-gray block mb-1">
                  욕실
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.baths}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, baths: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb"
                />
              </label>
            </div>
          </div>
        </section>

        {/* 섹션 4: 편의시설 */}
        {amenities.length > 0 && (
          <section className="rounded-2xl border border-airbnb-light-gray bg-white p-6 md:p-8">
            <h2 className="text-lg font-semibold text-airbnb-black mb-4">
              4. 편의시설
            </h2>
            <p className="text-airbnb-caption text-airbnb-gray mb-4">
              해당하는 항목을 선택해 주세요.
            </p>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAmenity(a.id)}
                  className={`px-4 py-2 rounded-airbnb border text-airbnb-body transition-colors ${
                    form.amenityIds.includes(a.id)
                      ? "bg-airbnb-black text-white border-airbnb-black"
                      : "border-airbnb-light-gray text-airbnb-black hover:bg-airbnb-bg"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {error && (
          <p className="text-airbnb-body text-airbnb-red" role="alert">
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
