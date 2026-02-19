"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  initialEnabled: boolean;
};

export default function MessageAutoTranslateToggle({ initialEnabled }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    if (saving) return;
    const next = !enabled;
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoTranslateEnabled: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnabled(next);
        router.refresh();
      } else {
        toast.error(data.error || "설정 저장에 실패했습니다.");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-minbak-light-gray">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={handleToggle}
          className="w-4 h-4 rounded border-minbak-light-gray text-minbak-primary focus:ring-minbak-primary"
        />
        <span className="text-minbak-caption text-minbak-black">
          자동 번역 {enabled ? "ON" : "OFF"}
        </span>
        {saving && (
          <span className="text-minbak-caption text-minbak-gray">저장 중...</span>
        )}
      </label>
      <p className="text-minbak-caption text-minbak-gray mt-0.5">
        상대방 메시지를 내 언어로 자동 번역합니다.
      </p>
    </div>
  );
}
