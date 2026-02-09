"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DayAvailability = {
  date: string;
  pricePerNight: number | null;
  available: boolean;
};

type Props = {
  listingId: string;
  listingTitle: string;
  defaultPricePerNight: number;
  initialMonth: string;
};

export default function AvailabilityEditor({
  listingId,
  defaultPricePerNight,
  initialMonth,
}: Props) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMonth(initialMonth);
  }, [initialMonth]);
  const [editing, setEditing] = useState<{ date: string; pricePerNight: number | null; available: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/host/listings/${listingId}/availability?month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.availability) setAvailability(data.availability);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [listingId, month]);

  const goPrev = () => {
    const [y, m] = month.split("-").map(Number);
    const next = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
    setMonth(next);
    router.push(`?month=${next}`, { scroll: false });
  };
  const goNext = () => {
    const [y, m] = month.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    setMonth(next);
    router.push(`?month=${next}`, { scroll: false });
  };

  const applyUpdate = async (date: string, available: boolean, pricePerNight: number | null) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/host/listings/${listingId}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ date, available, pricePerNight }],
        }),
      });
      if (res.ok) {
        setAvailability((prev) =>
          prev.map((d) =>
            d.date === date ? { ...d, available, pricePerNight } : d
          )
        );
        setEditing(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `${y}년 ${m}월`;

  return (
    <div className="border border-airbnb-light-gray rounded-airbnb p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="p-2 rounded-airbnb hover:bg-airbnb-bg"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-airbnb-body font-semibold text-airbnb-black min-w-[100px] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="p-2 rounded-airbnb hover:bg-airbnb-bg"
            aria-label="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/host/listings/${listingId}/availability?month=${month}`)}
          className="text-airbnb-caption text-airbnb-gray hover:text-airbnb-black"
        >
          새로고침
        </button>
      </div>

      {loading ? (
        <p className="text-airbnb-body text-airbnb-gray">로딩 중...</p>
      ) : (
        <ul className="space-y-2">
          {availability.map((day) => (
            <li
              key={day.date}
              className={`flex items-center justify-between py-2 px-3 rounded-airbnb border ${
                day.available ? "border-airbnb-light-gray bg-white" : "border-red-200 bg-red-50"
              }`}
            >
              <span className="text-airbnb-body text-airbnb-black">
                {day.date}
                {!day.available && (
                  <span className="ml-2 text-airbnb-caption text-red-600">예약 불가</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {editing?.date === day.date ? (
                  <>
                    <label className="flex items-center gap-1 text-airbnb-caption">
                      <input
                        type="checkbox"
                        checked={editing.available}
                        onChange={(e) =>
                          setEditing((p) => p ? { ...p, available: e.target.checked } : null)
                        }
                      />
                      예약 가능
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editing.pricePerNight ?? ""}
                      onChange={(e) =>
                        setEditing((p) =>
                          p
                            ? {
                                ...p,
                                pricePerNight: e.target.value === "" ? null : parseInt(e.target.value, 10),
                              }
                            : null
                        )
                      }
                      placeholder={`기본 ${defaultPricePerNight}`}
                      className="w-24 px-2 py-1 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        applyUpdate(
                          day.date,
                          editing.available,
                          editing.pricePerNight ?? null
                        )
                      }
                      disabled={saving}
                      className="px-2 py-1 text-airbnb-caption bg-airbnb-red text-white rounded-airbnb disabled:opacity-50"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="px-2 py-1 text-airbnb-caption border border-airbnb-light-gray rounded-airbnb"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-airbnb-body text-airbnb-gray">
                      {day.pricePerNight != null
                        ? `₩${day.pricePerNight.toLocaleString()}/박`
                        : `기본 ₩${defaultPricePerNight.toLocaleString()}/박`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          date: day.date,
                          pricePerNight: day.pricePerNight,
                          available: day.available,
                        })
                      }
                      className="px-2 py-1 text-airbnb-caption border border-airbnb-light-gray rounded-airbnb hover:bg-airbnb-bg"
                    >
                      수정
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
