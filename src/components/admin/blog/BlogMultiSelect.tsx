"use client";

import { useState } from "react";

export type MultiSelectOption = { value: string; label: string; sub?: string };

type Props = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** 목록에 없는 값을 직접 입력할 수 있게 (숙소 ID 직접 입력 등) */
  allowManual?: boolean;
  manualPlaceholder?: string;
  emptyHint?: string;
};

export default function BlogMultiSelect({
  options,
  selected,
  onChange,
  allowManual = false,
  manualPlaceholder = "직접 입력",
  emptyHint = "선택할 항목이 없습니다.",
}: Props) {
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState("");

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  function addManual() {
    const v = manual.trim();
    if (v && !selected.includes(v)) onChange([...selected, v]);
    setManual("");
  }

  const optionMap = new Map(options.map((o) => [o.value, o]));
  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.value.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((v) => {
            const o = optionMap.get(v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-minbak-primary/10 text-minbak-primary text-minbak-caption"
              >
                {o?.label ?? v}
                <button
                  type="button"
                  onClick={() => toggle(v)}
                  className="text-minbak-primary/70 hover:text-minbak-primary"
                  aria-label="제거"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {options.length > 8 && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색"
          className="w-full px-3 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-caption"
        />
      )}

      <div className="max-h-44 overflow-y-auto border border-minbak-light-gray rounded-minbak divide-y divide-minbak-light-gray">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-minbak-caption text-minbak-gray">{emptyHint}</p>
        ) : (
          filtered.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-2 px-3 py-1.5 text-minbak-caption hover:bg-minbak-bg cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggle(o.value)}
                className="rounded border-minbak-light-gray"
              />
              <span className="text-minbak-black">{o.label}</span>
              {o.sub && <span className="text-minbak-gray">· {o.sub}</span>}
            </label>
          ))
        )}
      </div>

      {allowManual && (
        <div className="flex gap-2">
          <input
            type="text"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addManual();
              }
            }}
            placeholder={manualPlaceholder}
            className="flex-1 px-3 py-1.5 border border-minbak-light-gray rounded-minbak text-minbak-caption"
          />
          <button
            type="button"
            onClick={addManual}
            className="px-3 py-1.5 text-minbak-caption font-medium border border-minbak-light-gray rounded-minbak bg-white hover:bg-minbak-bg"
          >
            추가
          </button>
        </div>
      )}
    </div>
  );
}
