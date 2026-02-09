"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import Link from "next/link";

type Amenity = { id: string; name: string };
type Category = { id: string; name: string };

type Props = {
  listingId: string;
  amenities: Amenity[];
  categories: Category[];
  initial: {
    title: string;
    location: string;
    description: string;
    pricePerNight: number;
    imageUrls: string[];
    maxGuests: number;
    bedrooms: number;
    beds: number;
    baths: number;
    categoryId: string;
    icalImportUrls: string[];
    amenityIds: string[];
  };
};

export default function EditListingForm({ listingId, amenities, categories: initialCategories, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [form, setForm] = useState({
    title: initial.title,
    location: initial.location,
    description: initial.description,
    pricePerNight: String(initial.pricePerNight),
    maxGuests: String(initial.maxGuests),
    bedrooms: String(initial.bedrooms),
    beds: String(initial.beds),
    baths: String(initial.baths),
    categoryId: initial.categoryId,
    icalImportUrls: initial.icalImportUrls.join("\n"),
    amenityIds: initial.amenityIds ?? [],
    mapUrl: initial.mapUrl ?? "",
  });
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
    initial.imageUrls.length > 0 ? initial.imageUrls : []
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

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
    const toAdd = Array.from(files).filter((f) => allowed.includes(f.type) && f.size <= 5 * 1024 * 1024);
    const maxToAdd = Math.max(0, 100 - existingImageUrls.length);
    setNewImageFiles((prev) => [...prev, ...toAdd].slice(0, maxToAdd));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = parseInt(form.pricePerNight, 10);
    const totalImages = existingImageUrls.length + newImageFiles.length;
    if (!form.title.trim() || !form.location.trim() || totalImages === 0 || isNaN(price) || price < 0) {
      setError("숙소명, 위치, 이미지 1장 이상, 1박 요금을 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      let finalUrls = [...existingImageUrls];
      if (newImageFiles.length > 0) {
        const fd = new FormData();
        newImageFiles.forEach((f) => fd.append("files", f));
        const uploadRes = await fetch("/api/upload/listing", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error || "이미지 업로드에 실패했습니다.");
          return;
        }
        finalUrls = [...existingImageUrls, ...(uploadData.urls as string[])];
      }
      const rawMap = form.mapUrl.trim();
      const mapUrl =
        rawMap && rawMap.includes("<iframe")
          ? (rawMap.match(/src="([^"]+)"/)?.[1] ?? "")
          : rawMap;
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          location: form.location.trim(),
          description: form.description.trim() || undefined,
          pricePerNight: price,
          imageUrls: finalUrls,
          maxGuests: parseInt(form.maxGuests, 10) || 2,
          bedrooms: parseInt(form.bedrooms, 10) || 1,
          beds: parseInt(form.beds, 10) || 1,
          baths: parseInt(form.baths, 10) || 1,
          categoryId: form.categoryId.trim() || undefined,
          icalImportUrls: form.icalImportUrls
            .split("\n")
            .map((u) => u.trim())
            .filter(Boolean),
          amenityIds: form.amenityIds,
          mapUrl: mapUrl || undefined,
        }),
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
      <main className="min-h-screen pt-32 md:pt-40 px-6">
        <div className="max-w-[600px] mx-auto py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <Link
              href="/host/listings"
              className="text-airbnb-body text-airbnb-gray hover:underline"
            >
              ← 내 숙소로
            </Link>
            <Link
              href={`/host/listings/${listingId}/availability`}
              className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black border border-airbnb-light-gray rounded-airbnb px-3 py-1.5"
            >
              요금·예약 불가 설정
            </Link>
          </div>
          <h1 className="text-airbnb-h2 font-semibold text-airbnb-black mb-6">
            숙소 수정
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="text-airbnb-caption text-airbnb-gray mb-2">기존 이미지를 유지하거나 새로 업로드할 수 있습니다. JPEG/PNG/WebP/GIF, 최대 5MB.</p>
              <div className="flex flex-wrap gap-3 mb-3">
                {existingImageUrls.map((url, i) => (
                  <div key={`ex-${i}`} className="relative group">
                    <img
                      src={url}
                      alt={`기존 ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-airbnb border border-airbnb-light-gray"
                    />
                    <button
                      type="button"
                      onClick={() => setExistingImageUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-sm leading-none flex items-center justify-center hover:bg-black"
                    >
                      ×
                    </button>
                    {i === 0 && existingImageUrls.length > 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1 rounded">대표</span>
                    )}
                  </div>
                ))}
                {newImageFiles.map((file, i) => (
                  <div key={`new-${i}`} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`새로 추가 ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-airbnb border border-airbnb-light-gray"
                    />
                    <button
                      type="button"
                      onClick={() => setNewImageFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-sm leading-none flex items-center justify-center hover:bg-black"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {existingImageUrls.length + newImageFiles.length < 10 && (
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

            {/* 편의시설 수정 */}
            <section className="border border-airbnb-light-gray rounded-airbnb bg-white p-4 space-y-3">
              <h2 className="text-airbnb-body font-semibold text-airbnb-black">
                부가시설 및 서비스
              </h2>
              <p className="text-airbnb-caption text-airbnb-gray">
                게스트가 숙소에서 사용할 수 있는 편의시설을 선택해 주세요.
              </p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => {
                  const checked = form.amenityIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAmenity(a.id)}
                      className={`px-3 py-1.5 rounded-full text-[13px] border ${
                        checked
                          ? "bg-airbnb-black text-white border-airbnb-black"
                          : "bg-white text-airbnb-black border-airbnb-light-gray hover:bg-airbnb-bg"
                      }`}
                    >
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </section>
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
                  Airbnb·Beds24 등에서 발급한 &quot;캘린더 내보내기&quot; URL을 넣으면, 그 채널에 예약된 날은 우리 사이트에서 선택할 수 없습니다.
                </p>
                <textarea
                  value={form.icalImportUrls}
                  onChange={(e) => setForm((f) => ({ ...f, icalImportUrls: e.target.value }))}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  rows={3}
                  className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb resize-y font-mono text-airbnb-caption"
                />
              </label>
            </div>
            {error && (
              <p className="text-airbnb-body text-airbnb-red" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" variant="secondary" disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </form>
        </div>
        <Footer />
      </main>
    </>
  );
}
