"use client";

import { useEffect, useState, useCallback } from "react";
import { useHostTranslations } from "./HostLocaleProvider";

type Template = {
  id: string;
  title: string;
  body: string;
  trigger: string;
  offsetDays: number;
  sendTime: string;
  listingIds: string[];
  listings: { id: string; title: string }[];
  enabled: boolean;
};

type ListingOption = { id: string; title: string };

const TRIGGERS = [
  "booking_confirmed",
  "before_checkin",
  "after_checkin",
  "before_checkout",
  "after_checkout",
] as const;

const SHORTCODES = [
  "{guest_name}",
  "{host_name}",
  "{listing_name}",
  "{listing_address}",
  "{checkin_date}",
  "{checkout_date}",
  "{guests_count}",
  "{nights}",
  "{total_price}",
  "{house_rules}",
];

const triggerLabelKey: Record<string, string> = {
  booking_confirmed: "scheduledMsg.triggerBookingConfirmed",
  before_checkin: "scheduledMsg.triggerBeforeCheckin",
  after_checkin: "scheduledMsg.triggerAfterCheckin",
  before_checkout: "scheduledMsg.triggerBeforeCheckout",
  after_checkout: "scheduledMsg.triggerAfterCheckout",
};

export default function ScheduledTemplatesContent() {
  const { t } = useHostTranslations();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    body: "",
    trigger: "booking_confirmed" as string,
    offsetDays: 0,
    sendTime: "10:00",
    applyToAll: true,
    listingIds: [] as string[],
    enabled: true,
  });

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/host/scheduled-templates");
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, []);

  const fetchListings = useCallback(async () => {
    const res = await fetch("/api/host/listings");
    if (res.ok) {
      const data = await res.json();
      setListings(
        (data.listings ?? data).map((l: { id: string; title: string; hostDisplayName?: string | null }) => ({
          id: l.id,
          title: l.hostDisplayName?.trim() || l.title,
        }))
      );
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchListings();
  }, [fetchTemplates, fetchListings]);

  function resetForm() {
    setForm({
      title: "",
      body: "",
      trigger: "booking_confirmed",
      offsetDays: 0,
      sendTime: "10:00",
      applyToAll: true,
      listingIds: [],
      enabled: true,
    });
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(tpl: Template) {
    const ids = tpl.listingIds ?? [];
    setForm({
      title: tpl.title,
      body: tpl.body,
      trigger: tpl.trigger,
      offsetDays: tpl.offsetDays,
      sendTime: tpl.sendTime,
      applyToAll: ids.length === 0,
      listingIds: ids,
      enabled: tpl.enabled,
    });
    setEditId(tpl.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const listingIds = form.applyToAll ? [] : form.listingIds;
    const payload = {
      title: form.title,
      body: form.body,
      trigger: form.trigger,
      offsetDays: form.offsetDays,
      sendTime: form.sendTime,
      listingIds,
      enabled: form.enabled,
    };

    if (editId) {
      await fetch(`/api/host/scheduled-templates/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/host/scheduled-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    resetForm();
    fetchTemplates();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("scheduledMsg.deleteConfirm" as Parameters<typeof t>[0])))
      return;
    await fetch(`/api/host/scheduled-templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  async function handleToggle(id: string, current: boolean) {
    await fetch(`/api/host/scheduled-templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !current }),
    });
    fetchTemplates();
  }

  function insertShortcode(code: string) {
    setForm((prev) => ({ ...prev, body: prev.body + code }));
  }

  const triggerLabel = (trigger: string) =>
    t((triggerLabelKey[trigger] || trigger) as Parameters<typeof t>[0]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-center text-gray-500">...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-minbak-black">
          {t("scheduledMsg.manageQuickReplies" as Parameters<typeof t>[0])}
        </h1>
        <p className="mt-1 text-sm text-minbak-gray">
          {t("scheduledMsg.managePageDescription" as Parameters<typeof t>[0])}
        </p>
      </div>
      <div className="flex items-center justify-end mb-4">
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 text-sm font-medium"
          >
            + {t("scheduledMsg.create" as Parameters<typeof t>[0])}
          </button>
        )}
      </div>

      {showForm && (
        <div className="border rounded-xl p-5 space-y-4 bg-white shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("scheduledMsg.templateTitle" as Parameters<typeof t>[0])}
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="체크인 안내 / チェックインご案内"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("scheduledMsg.templateBody" as Parameters<typeof t>[0])}
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[120px]"
              value={form.body}
              onChange={(e) =>
                setForm((p) => ({ ...p, body: e.target.value }))
              }
              placeholder="{guest_name}님, 체크인까지 {nights}일 남았습니다..."
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {SHORTCODES.map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => insertShortcode(sc)}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("scheduledMsg.trigger" as Parameters<typeof t>[0])}
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.trigger}
                onChange={(e) =>
                  setForm((p) => ({ ...p, trigger: e.target.value }))
                }
              >
                {TRIGGERS.map((tr) => (
                  <option key={tr} value={tr}>
                    {triggerLabel(tr)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("scheduledMsg.offsetDays" as Parameters<typeof t>[0], { n: "" })}
              </label>
              <input
                type="number"
                min={0}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.offsetDays}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    offsetDays: Math.max(0, parseInt(e.target.value) || 0),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("scheduledMsg.sendTime" as Parameters<typeof t>[0])}
              </label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.sendTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sendTime: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("scheduledMsg.applyTo" as Parameters<typeof t>[0])}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={form.applyToAll}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      applyToAll: e.target.checked,
                      ...(e.target.checked ? { listingIds: [] } : {}),
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <span>{t("scheduledMsg.applyToAllCheckbox" as Parameters<typeof t>[0])}</span>
              </label>
              {!form.applyToAll && (
                <div className="mt-2 pl-4 border-l-2 border-gray-200 space-y-1.5 max-h-48 overflow-y-auto">
                  {listings.map((l) => (
                    <label
                      key={l.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.listingIds.includes(l.id)}
                        onChange={(e) => {
                          setForm((p) => ({
                            ...p,
                            listingIds: e.target.checked
                              ? [...p.listingIds, l.id]
                              : p.listingIds.filter((id) => id !== l.id),
                          }));
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="truncate">{l.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm((p) => ({ ...p, enabled: e.target.checked }))
              }
            />
            {t("scheduledMsg.enabled" as Parameters<typeof t>[0])}
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.body.trim()}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 text-sm font-medium disabled:opacity-50"
            >
              {saving
                ? t("scheduledMsg.saving" as Parameters<typeof t>[0])
                : t("scheduledMsg.save" as Parameters<typeof t>[0])}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              {t("scheduledMsg.cancel" as Parameters<typeof t>[0])}
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 && !showForm && (
        <p className="text-center text-gray-500 py-12">
          {t("scheduledMsg.empty" as Parameters<typeof t>[0])}
        </p>
      )}

      <div className="space-y-3">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="border rounded-xl p-4 bg-white shadow-sm flex items-start gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{tpl.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    tpl.enabled
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t(
                    (tpl.enabled
                      ? "scheduledMsg.enabled"
                      : "scheduledMsg.disabled") as Parameters<typeof t>[0]
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {triggerLabel(tpl.trigger)} · +{tpl.offsetDays}
                {t("scheduledMsg.offsetDays" as Parameters<typeof t>[0], { n: "" }).replace(/\s/g, "")} · {tpl.sendTime} JST
                {tpl.listings && tpl.listings.length > 0 ? (
                  <span className="ml-1">· {tpl.listings.map((l) => l.title).join(", ")}</span>
                ) : (
                  <span className="ml-1">· {t("scheduledMsg.allListings" as Parameters<typeof t>[0])}</span>
                )}
              </p>
              <p className="text-sm text-gray-700 mt-1 truncate">
                {tpl.body}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleToggle(tpl.id, tpl.enabled)}
                className={`text-xs px-2 py-1 rounded ${
                  tpl.enabled
                    ? "bg-gray-100 text-gray-600"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {tpl.enabled
                  ? t("scheduledMsg.disabled" as Parameters<typeof t>[0])
                  : t("scheduledMsg.enabled" as Parameters<typeof t>[0])}
              </button>
              <button
                onClick={() => startEdit(tpl)}
                className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600"
              >
                {t("scheduledMsg.edit" as Parameters<typeof t>[0])}
              </button>
              <button
                onClick={() => handleDelete(tpl.id)}
                className="text-xs px-2 py-1 rounded bg-red-50 text-red-600"
              >
                {t("scheduledMsg.delete" as Parameters<typeof t>[0])}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
